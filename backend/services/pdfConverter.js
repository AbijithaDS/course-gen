const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * High-fidelity conversion of DOCX to PDF.
 * Single responsibility: converts DOCX to PDF preserving formatting exactly.
 * 
 * Priority 1: MS Word PDF Export (via PowerShell COM using a temporary script file)
 * Priority 2: LibreOffice Headless
 * 
 * @param {string} docxPath - Absolute path to input DOCX file
 * @param {string} pdfPath - Optional custom absolute path to output PDF file
 * @returns {Promise<{success: boolean, pdfPath: string, pageCount: number}>}
 */
async function convertDocxToPdf(docxPath, pdfPath = null) {
  const absoluteDocxPath = path.resolve(docxPath);
  const targetPdfPath = pdfPath 
    ? path.resolve(pdfPath) 
    : absoluteDocxPath.replace(/\.docx$/i, '.pdf');

  console.log('[PdfConverter] Initiating conversion:', absoluteDocxPath, '->', targetPdfPath);

  if (!fs.existsSync(absoluteDocxPath)) {
    throw new Error('Input DOCX file not found: ' + absoluteDocxPath);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(targetPdfPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean up any existing file at output destination
  if (fs.existsSync(targetPdfPath)) {
    try { fs.unlinkSync(targetPdfPath); } catch (_) {}
  }

  let errorLogs = [];

  // ─── Priority 1: Microsoft Word (via PowerShell COM using temp script) ───
  const tempScriptPath = path.join(outputDir, `convert_${Date.now()}_${Math.floor(Math.random() * 1000)}.ps1`);
  try {
    console.log('[PdfConverter] Attempting MS Word via COM (using temp script)...');
    
    // Build clean PowerShell commands with single-quoted arguments to avoid escape corruption
    const psLines = [
      '$ErrorActionPreference = "Stop"',
      '$word = New-Object -ComObject Word.Application',
      '$word.DisplayAlerts = 0', // Disable Office activation and other popups/alerts
      '$word.Visible = $false',
      'try {',
      `    $doc = $word.Documents.Open('${absoluteDocxPath.replace(/'/g, "''")}', $false, $true)`,
      '    $pageCount = $doc.ComputeStatistics(2)',
      `    $doc.ExportAsFixedFormat('${targetPdfPath.replace(/'/g, "''")}', 17)`,
      '    $doc.Close()',
      '    Write-Host "JSON_OUT: {\"success\": true, \"pageCount\": $pageCount}"',
      '} catch {',
      '    $err = $_.Exception.Message.Replace("\", "\\").Replace("\"", \"\\\"\")',
      '    Write-Host "JSON_OUT: {\"success\": false, \"error\": \"$err\"}"',
      '} finally {',
      '    $word.Quit()',
      '}'
    ];

    fs.writeFileSync(tempScriptPath, psLines.join('\r\n'), 'utf8');
    
    const output = execSync(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}"`,
      { encoding: 'utf8', timeout: 90000 }
    );

    // Clean up temp script
    try { fs.unlinkSync(tempScriptPath); } catch (_) {}

    const jsonMatch = output.match(/JSON_OUT:\s*({.+})/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[1]);
      if (result.success && fs.existsSync(targetPdfPath)) {
        const stats = fs.statSync(targetPdfPath);
        if (stats.size > 0 && result.pageCount > 0) {
          console.log('[PdfConverter] MS Word conversion success. Pages:', result.pageCount, 'Size:', stats.size, 'bytes');
          return {
            success: true,
            pdfPath: targetPdfPath,
            pageCount: result.pageCount
          };
        }
      } else if (result.error) {
        throw new Error(result.error);
      }
    }
    throw new Error('Word COM execution finished but output was invalid or file not created');
  } catch (wordErr) {
    // Clean up temp script if exists
    if (fs.existsSync(tempScriptPath)) {
      try { fs.unlinkSync(tempScriptPath); } catch (_) {}
    }
    const msg = 'MS Word COM failed: ' + wordErr.message;
    console.warn('[PdfConverter] ' + msg);
    errorLogs.push(msg);
  }

  // ─── Priority 2: LibreOffice Headless ────────────────────────────────────
  try {
    console.log('[PdfConverter] Attempting LibreOffice Headless...');
    
    // Find soffice in common locations or in PATH
    let sofficePath = 'soffice'; // default check in PATH
    const typicalPaths = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
    ];
    for (const p of typicalPaths) {
      if (fs.existsSync(p)) {
        sofficePath = '\"' + p + '\"';
        break;
      }
    }

    const command = sofficePath + ' --headless --convert-to pdf --outdir "' + outputDir + '" "' + absoluteDocxPath + '"';
    console.log('[PdfConverter] Running:', command);
    
    execSync(command, { timeout: 90000 });

    // LibreOffice saves to the same filename but with .pdf in the outdir
    const expectedPdf = absoluteDocxPath.replace(/\.docx$/i, '.pdf');
    if (expectedPdf !== targetPdfPath && fs.existsSync(expectedPdf)) {
      fs.renameSync(expectedPdf, targetPdfPath);
    }

    if (fs.existsSync(targetPdfPath)) {
      const stats = fs.statSync(targetPdfPath);
      if (stats.size > 0) {
        let pageCount = 1;
        try {
          const pyScript = [
            'import sys',
            'from PyPDF2 import PdfReader',
            'reader = PdfReader("' + targetPdfPath.replace(/\\/g, '\\\\') + '")',
            'print(len(reader.pages))'
          ].join('; ');
          const pyOut = execSync('python -c "' + pyScript + '"', { encoding: 'utf8', timeout: 15000 });
          const parsedPages = parseInt(pyOut.trim(), 10);
          if (!isNaN(parsedPages) && parsedPages > 0) {
            pageCount = parsedPages;
          }
        } catch (pyErr) {
          console.warn('[PdfConverter] Failed to get page count via PyPDF2, using fallback count 1:', pyErr.message);
        }

        console.log('[PdfConverter] LibreOffice conversion success. Pages:', pageCount, 'Size:', stats.size, 'bytes');
        return {
          success: true,
          pdfPath: targetPdfPath,
          pageCount: pageCount
        };
      }
    }
    throw new Error('LibreOffice execution finished but output file not found or empty');
  } catch (loErr) {
    const msg = 'LibreOffice Headless failed: ' + loErr.message;
    console.error('[PdfConverter] ' + msg);
    errorLogs.push(msg);
  }

  throw new Error('All PDF conversion pipelines failed.\nErrors:\n- ' + errorLogs.join('\n- '));
}

module.exports = {
  convertDocxToPdf
};
