const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PdfConverter {
  /**
   * Verifies if Microsoft Word is installed by querying TypeFromName ProgID.
   * Runs safely in PowerShell without launching the WINWORD.EXE process.
   * @returns {boolean}
   */
  isWordInstalled() {
    try {
      const output = execSync(
        `powershell.exe -NoProfile -Command "if ([Type]::GetTypeFromProgID('Word.Application')) { Write-Host 'INSTALLED' } else { Write-Host 'NOT_INSTALLED' }"`,
        { encoding: 'utf8', timeout: 5000 }
      );
      return output.trim() === 'INSTALLED';
    } catch (_) {
      return false;
    }
  }

  /**
   * Verifies if LibreOffice soffice CLI is available in the system PATH or typical directories.
   * @returns {boolean}
   */
  isLibreOfficeInstalled() {
    try {
      execSync('where.exe soffice', { stdio: 'ignore' });
      return true;
    } catch (_) {
      // Check typical installation paths on Windows
      const typicalPaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
      ];
      for (const p of typicalPaths) {
        if (fs.existsSync(p)) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Stage 1: Microsoft Word via COM Automation
   * @param {string} docxPath - Absolute path to DOCX file
   * @param {string} pdfPath - Absolute path to target PDF file
   * @returns {Promise<{success: boolean, pageCount?: number, reason?: string}>}
   */
  async tryWordCOM(docxPath, pdfPath) {
    if (!this.isWordInstalled()) {
      console.log('✗ Word COM unavailable');
      return { success: false, reason: 'Word COM not installed' };
    }

    const tempScriptPath = path.join(path.dirname(pdfPath), `convert_${Date.now()}_${Math.floor(Math.random() * 1000)}.ps1`);
    try {
      const absoluteDocxPath = path.resolve(docxPath);
      const targetPdfPath = path.resolve(pdfPath);

      // Define static template to avoid escape corruption
      const psTemplate = [
        '$ErrorActionPreference = "Stop"',
        '$word = New-Object -ComObject Word.Application',
        '$word.DisplayAlerts = 0',
        '$word.Visible = $false',
        'try {',
        '    $doc = $word.Documents.Open(\'__DOCX_PATH__\', $false, $true)',
        '    $pageCount = $doc.ComputeStatistics(2)',
        '    $doc.ExportAsFixedFormat(\'__PDF_PATH__\', 17)',
        '    $doc.Close(0)',
        '    Write-Host "JSON_OUT: {""success"": true, ""pageCount"": $pageCount}"',
        '} catch {',
        '    Write-Host "JSON_OUT: {""success"": false, ""error"": ""PDF conversion failed""}"',
        '} finally {',
        '    $word.Quit()',
        '}'
      ].join('\r\n');

      const escapedDocxPath = absoluteDocxPath.replace(/'/g, "''");
      const escapedPdfPath = targetPdfPath.replace(/'/g, "''");
      const psContent = psTemplate
        .replace('__DOCX_PATH__', escapedDocxPath)
        .replace('__PDF_PATH__', escapedPdfPath);

      fs.writeFileSync(tempScriptPath, psContent, 'utf8');

      const output = execSync(
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}"`,
        { encoding: 'utf8', timeout: 90000 }
      );

      // Clean up temp script file
      try { fs.unlinkSync(tempScriptPath); } catch (_) {}

      const jsonMatch = output.match(/JSON_OUT:\s*({.+})/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1]);
        if (result.success && fs.existsSync(targetPdfPath)) {
          const stats = fs.statSync(targetPdfPath);
          if (stats.size > 0 && result.pageCount > 0) {
            console.log('✓ Word conversion succeeded');
            return { success: true, pdfPath: targetPdfPath, pageCount: result.pageCount };
          }
        }
      }
      console.log('✗ Word COM conversion failed');
      return { success: false, reason: 'Word COM conversion failed' };
    } catch (err) {
      if (fs.existsSync(tempScriptPath)) {
        try { fs.unlinkSync(tempScriptPath); } catch (_) {}
      }
      console.log('✗ Word COM conversion failed');
      return { success: false, reason: 'Word COM execution error' };
    }
  }

  /**
   * Stage 2: LibreOffice Headless
   * @param {string} docxPath - Absolute path to DOCX file
   * @param {string} pdfPath - Absolute path to target PDF file
   * @returns {Promise<{success: boolean, reason?: string}>}
   */
  async tryLibreOffice(docxPath, pdfPath) {
    if (!this.isLibreOfficeInstalled()) {
      console.log('✗ LibreOffice not installed');
      return { success: false, reason: 'LibreOffice not installed' };
    }

    try {
      const absoluteDocxPath = path.resolve(docxPath);
      const targetPdfPath = path.resolve(pdfPath);
      const outputDir = path.dirname(targetPdfPath);

      let sofficePath = 'soffice';
      const typicalPaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
      ];
      for (const p of typicalPaths) {
        if (fs.existsSync(p)) {
          sofficePath = `"${p}"`;
          break;
        }
      }

      const command = `${sofficePath} --headless --convert-to pdf --outdir "${outputDir}" "${absoluteDocxPath}"`;
      execSync(command, { timeout: 90000, stdio: 'ignore' });

      // Rename output PDF if filename differs from targetPdfPath
      const expectedPdf = absoluteDocxPath.replace(/\.docx$/i, '.pdf');
      if (expectedPdf !== targetPdfPath && fs.existsSync(expectedPdf)) {
        fs.renameSync(expectedPdf, targetPdfPath);
      }

      if (fs.existsSync(targetPdfPath)) {
        const stats = fs.statSync(targetPdfPath);
        if (stats.size > 0) {
          console.log('✓ LibreOffice conversion succeeded');
          return { success: true };
        }
      }
      console.log('✗ LibreOffice conversion failed');
      return { success: false, reason: 'LibreOffice output file not found or empty' };
    } catch (err) {
      console.log('✗ LibreOffice conversion failed');
      return { success: false, reason: 'LibreOffice execution failed' };
    }
  }

  /**
   * Stage 3: Mammoth HTML conversion (DOCX -> HTML fallback)
   * @param {string} docxPath - Absolute path to DOCX file
   * @returns {Promise<{success: boolean, html?: string, reason?: string}>}
   */
  async tryMammothHTML(docxPath) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.convertToHtml({ path: docxPath });
      if (result && result.value) {
        return { success: true, html: result.value };
      }
      return { success: false, reason: 'Mammoth conversion returned empty value' };
    } catch (err) {
      return { success: false, reason: 'Mammoth execution error' };
    }
  }

  /**
   * Main convert interface.
   * DOCX -> Word COM -> LibreOffice -> Mammoth HTML -> Error.
   * Returns path to generated PDF, or null if PDF conversion fails.
   * @param {string} docxPath - Absolute path to input DOCX file
   * @param {string} pdfPath - Optional custom absolute path to output PDF file
   * @returns {Promise<string|null>}
   */
  async convert(docxPath, pdfPath = null) {
    const absoluteDocxPath = path.resolve(docxPath);
    const targetPdfPath = pdfPath 
      ? path.resolve(pdfPath) 
      : absoluteDocxPath.replace(/\.docx$/i, '.pdf');

    // Ensure parent directories exist
    const outputDir = path.dirname(targetPdfPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Clean up any stale PDF file
    if (fs.existsSync(targetPdfPath)) {
      try { fs.unlinkSync(targetPdfPath); } catch (_) {}
    }

    // Stage 1: Word COM
    const comResult = await this.tryWordCOM(absoluteDocxPath, targetPdfPath);
    if (comResult.success) {
      return targetPdfPath;
    }

    // Stage 2: LibreOffice
    const loResult = await this.tryLibreOffice(absoluteDocxPath, targetPdfPath);
    if (loResult.success) {
      return targetPdfPath;
    }

    // Stage 3: Mammoth HTML fallback (Optional / logs only)
    await this.tryMammothHTML(absoluteDocxPath);

    console.log('PDF preview unavailable');
    return null;
  }
}

module.exports = PdfConverter;
