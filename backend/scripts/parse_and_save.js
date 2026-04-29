const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SOURCE_DIR = 'c:\\Users\\Dhanapal_Sumathi\\OneDrive\\Desktop\\CourseFiles';

const FILE_MAP = [
  { file: '1. Vision and  mission.docx.pdf', type: 'vision', category: 'static' },
  { file: '1. Vision and  mission.docx.pdf', type: 'mission', category: 'static' },
  { file: '2. PO, PSO & PEO (1).docx.pdf', type: 'po', category: 'static' },
  { file: '2. PO, PSO & PEO (1).docx.pdf', type: 'pso', category: 'static' },
  { file: '2. PO, PSO & PEO (1).docx.pdf', type: 'peo', category: 'static' },
  { file: 'sub 0.Course File Index -2025-26.docx.pdf', type: 'course_file', category: 'static' },
  { file: 'sub 7.Course Plan.pdf', type: 'syllabus', category: 'static' },
  { file: 'CIA - I Assignment DEV.pdf', type: 'assignment', category: 'ai' },
  { file: 'sub 10.Question Bank.pdf', type: 'qbank', category: 'ai' },
  { file: 'sub 13.Content Beyond The Syllabus.pdf', type: 'beyond', category: 'ai' },
  { file: 'Set A Data Exploration and Visualization  CIA- I.pdf', type: 'cia1', category: 'ai', subject: 'Data Exploration and Visualization' },
  { file: 'Set A Design and Analysis of Algorithms CIA- I.pdf', type: 'cia1', category: 'ai', subject: 'Design and Analysis of Algorithms' }
];

async function processFiles() {
  for (const item of FILE_MAP) {
    const filePath = path.join(SOURCE_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${item.file}`);
      continue;
    }

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      let content = data.text.trim();

      // Clean up text
      content = content.replace(/\n\s*\n/g, '\n\n');

      console.log(`Processed ${item.file} for ${item.type}`);

      // Insert into generated_content
      const { error } = await supabase
        .from('generated_content')
        .insert([
          {
            department: 'AI_DS',
            regulation: '2023',
            year: 3,
            semester: 5,
            subject: item.category === 'static' ? 'GLOBAL' : (item.subject || 'Default Subject'),
            type: item.type,
            content: content
          }
        ]);

      if (error) {
        console.error(`Error saving ${item.type}:`, error.message);
      } else {
        console.log(`Saved ${item.type} to database.`);
      }

    } catch (err) {
      console.error(`Failed to process ${item.file}:`, err);
    }
  }
}

processFiles();
