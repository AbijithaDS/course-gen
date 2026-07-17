const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize the database connection and default records
require('./data/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
}));
app.use(express.json({ limit: '10mb' }));

// Import Controllers and Services
const aiController = require('./controllers/aiController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const documentGenerator = require('./services/documentGenerator');

// --- Routes ---

// AI Generation Route
app.post('/api/generate', aiController.generateContent);
app.post('/api/generate-lab-manual', aiController.generateLabManual);

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/config', authController.getConfig);
app.post('/api/auth/google', authController.googleLogin);

// Admin Routes - Departments
app.get('/api/admin/departments', adminController.getDepartments);
app.post('/api/admin/departments', adminController.addDepartment);
app.delete('/api/admin/departments/:id', adminController.deleteDepartment);

// Admin Routes - Subjects
app.get('/api/admin/subjects', adminController.getSubjects);
app.post('/api/admin/subjects', adminController.addSubject);
app.delete('/api/admin/subjects/:id', adminController.deleteSubject);

// Admin Routes - Regulations
app.get('/api/admin/regulations', adminController.getRegulations);
app.post('/api/admin/regulations', adminController.addRegulation);

// Admin Routes - Audits & Analytics
app.get('/api/admin/generations', adminController.getGenerations);
app.get('/api/admin/stats', adminController.getStats);
app.get('/api/admin/users', adminController.getUsers);


// File Download Route for Pre-generated documents
app.get('/api/download/:filename', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'data', 'downloads', filename);
    
    if (fs.existsSync(filePath)) {
      console.log(`[Server] Serving file download: ${filename}`);
      res.download(filePath);
    } else {
      console.warn(`[Server] File not found for download: ${filename}`);
      res.status(404).send('File not found');
    }
  } catch (err) {
    console.error('[Server] File download error:', err);
    res.status(500).send('Internal server error');
  }
});

// Template Document Export Route (Supports DOCX and dynamic PDF conversion)
app.post('/api/export', async (req, res) => {
  try {
    const payload = req.body;
    console.log(`Received export request for ${payload.subjectCode} (${payload.type})`);
    
    const format = payload.format || payload.exportFormat || 'docx';
    const isPdf = format.toLowerCase() === 'pdf';

    const result = documentGenerator.generateDocument(payload);
    
    if (isPdf) {
      const fs = require('fs');
      const path = require('path');
      const PdfConverter = require('./services/pdfConverter');
      const pdfConverter = new PdfConverter();

      const downloadsDir = path.join(__dirname, 'data', 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const tempDocxPath = path.join(downloadsDir, `temp_exp_${uniqueId}.docx`);
      const tempPdfPath = tempDocxPath.replace(/\.docx$/i, '.pdf');

      fs.writeFileSync(tempDocxPath, result.buffer);

      try {
        console.log(`[Server Export] Converting compiled DOCX to PDF...`);
        const convertedPath = await pdfConverter.convert(tempDocxPath, tempPdfPath);
        
        if (convertedPath && fs.existsSync(tempPdfPath)) {
          const pdfBuffer = fs.readFileSync(tempPdfPath);
          
          // Clean up temp files
          try { fs.unlinkSync(tempDocxPath); } catch (_) {}
          try { fs.unlinkSync(tempPdfPath); } catch (_) {}

          const pdfFilename = result.filename.replace(/\.docx?$/i, '.pdf');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          return res.status(200).send(pdfBuffer);
        } else {
          throw new Error('PDF conversion returned null path');
        }
      } catch (pdfErr) {
        console.error(`[Server Export] PDF conversion failed:`, pdfErr);
        // Clean up temp files if they exist
        try { if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath); } catch (_) {}
        try { if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath); } catch (_) {}

        return res.status(500).json({ 
          success: false,
          message: 'PDF Preview unavailable'
        });
      }
    }

    // Default Word DOCX flow
    const contentType = result.isFallback 
      ? 'application/msword' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    
    res.status(200).send(result.buffer);
  } catch (error) {
    console.error('API Export error:', error);
    res.status(500).json({ error: 'Failed to compile formatted document', details: error.message });
  }
});

// Google Forms Apps Script Export Route
app.post('/api/export-google-form', (req, res) => {
  try {
    const { subjectCode, subjectName, content } = req.body;
    if (!subjectCode || !content) {
      return res.status(400).json({ error: 'Subject code and content are required.' });
    }
    
    const googleFormGenerator = require('./services/googleFormGenerator');
    const script = googleFormGenerator.generateGoogleAppsScript(subjectCode, subjectName, content);
    
    res.status(200).json({ success: true, script });
  } catch (error) {
    console.error('Google Form Export error:', error);
    res.status(500).json({ error: 'Failed to generate Google Form script', details: error.message });
  }
});

// Direct Google Forms API Create Route
app.post('/api/create-google-form', async (req, res) => {
  try {
    const { accessToken, subjectCode, subjectName, content } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Google Access Token is required to create a form.' });
    }
    if (!subjectCode || !content) {
      return res.status(400).json({ error: 'Subject code and content are required.' });
    }
    
    const quizToGoogleForm = require('./services/quizToGoogleForm');
    const result = await quizToGoogleForm.createFormFromQuiz(accessToken, subjectCode, subjectName, content);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Direct Google Form creation error:', error);
    res.status(500).json({ error: 'Failed to create Google Form directly', details: error.message });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Course File Generator Backend is running with dynamic databases' });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use!`);
    console.error(`A zombie Node.js process is likely holding port ${PORT} in the background.`);
    console.error(`To release the port, run: taskkill /F /IM node.exe`);
    process.exit(1);
  } else {
    console.error(err);
  }
});

