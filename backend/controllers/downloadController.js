const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

exports.downloadPdf = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${title || 'document'}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text(title || 'Academic Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Content
    doc.fontSize(12).text(content, {
      align: 'left',
      lineGap: 5
    });

    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

exports.downloadDocx = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title || 'Academic Document',
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 400 },
            alignment: 'center'
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleDateString()}`,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
            alignment: 'right'
          }),
          ...content.split('\n').map(line => new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24,
              }),
            ],
            spacing: { after: 200 }
          }))
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${title || 'document'}.docx`);
    res.send(buffer);
  } catch (error) {
    console.error('DOCX Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
};
