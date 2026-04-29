const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.generateContent = async (req, res) => {
  try {
    const { department, regulation, year, semester, subject, type } = req.body;

    if (!department || !semester || !subject || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for existing content in Supabase first
    let query = supabase
      .from('generated_content')
      .select('content')
      .eq('department', department)
      .eq('regulation', regulation || 'N/A')
      .eq('year', year || 0)
      .eq('semester', semester)
      .eq('type', type);

    // For static types (vision, mission, etc.), we can have global versions
    const staticTypes = ['vision', 'mission', 'po', 'pso', 'peo', 'course_file'];
    if (staticTypes.includes(type)) {
      query = query.or(`subject.eq.${subject},subject.eq.GLOBAL`);
    } else {
      query = query.eq('subject', subject);
    }

    const { data: existingContent, error: fetchError } = await query.single();

    if (existingContent) {
      console.log(`Found existing ${type} content for ${subject} in Supabase`);
      return res.status(200).json({
        success: true,
        generatedText: existingContent.content,
        source: 'database'
      });
    }

    if (req.body.dryRun) {
      return res.status(200).json({
        success: false,
        message: 'Content not found in database (dry run)',
        source: 'none'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    console.log(`Generating new ${type} content for ${subject} (${department}, Sem ${semester})`);

    // Define prompts based on type
    let promptInstruction = '';
    switch (type) {
      case 'cia1':
        promptInstruction = 'Generate a Continuous Internal Assessment 1 (CIA 1) question paper. Include Part A (short answers) and Part B (long answers).';
        break;
      case 'cia2':
        promptInstruction = 'Generate a Continuous Internal Assessment 2 (CIA 2) question paper. Include Part A (short answers) and Part B (long answers).';
        break;
      case 'qbank':
        promptInstruction = 'Generate a comprehensive Question Bank with unit-wise categorization. Include 2-mark and 16-mark questions.';
        break;
      case 'quiz':
        promptInstruction = 'Generate 15 multiple-choice questions (MCQs) for a quiz, along with the correct answers.';
        break;
      case 'hots':
        promptInstruction = 'Generate 5 Higher Order Thinking Skills (HOTS) questions that require critical analysis and application of concepts.';
        break;
      case 'assignment':
        promptInstruction = 'Generate 3 practical assignment questions/scenarios that require students to research or build something.';
        break;
      case 'beyond':
        promptInstruction = 'List 3 topics that are beyond the standard syllabus for this subject but are highly relevant to current industry trends, and explain why they are important.';
        break;
      default:
        promptInstruction = 'Generate general academic content for this subject.';
    }

    const prompt = `
    You are an expert academic professor.
    
    Subject: ${subject}
    Department: ${department} Engineering
    Semester: ${semester}
    Regulation: ${regulation || 'N/A'}
    
    Task: ${promptInstruction}
    
    Format the output cleanly in Markdown format. Do not use generic introductions, just provide the content directly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const generatedText = response.text;

    // Save to Supabase
    const { error: insertError } = await supabase
      .from('generated_content')
      .insert([
        {
          department,
          regulation: regulation || 'N/A',
          year: year || 0,
          semester,
          subject,
          type,
          content: generatedText
        }
      ]);

    if (insertError) {
      console.error('Error saving to Supabase:', insertError);
    }

    res.status(200).json({
      success: true,
      generatedText,
      source: 'ai'
    });
    
  } catch (error) {
    console.error('Error in generateContent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate content', 
      details: error.message 
    });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('static_files')
      .select('*');

    if (error) throw error;

    res.status(200).json({
      success: true,
      files: data
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch files' });
  }
};
