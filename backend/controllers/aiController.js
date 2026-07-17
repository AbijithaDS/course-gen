const { GoogleGenAI } = require('@google/genai');
const db = require('../data/db');
const path = require('path');
const fs = require('fs');

const cleanJsonResponse = (text) => {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
};

// Safe imports since we might fall back to standard fetch for Groq
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

exports.generateContent = async (req, res) => {
  try {
    const { department, semester, subject, type, regulation, generatedBy } = req.body;

    if (!department || !semester || !subject || !type || !regulation) {
      return res.status(400).json({ error: 'Missing required fields: department, semester, subject, type, and regulation are required' });
    }

    if (type === 'sessionplan') {
      const workingWeeks    = parseInt(req.body.workingWeeks, 10)    || 15;
      const classesPerWeek  = parseInt(req.body.classesPerWeek, 10)  || 4;
      const classDuration   = req.body.classDuration   || '1 Hour';
      const academicYear    = req.body.academicYear    || '2025-26';
      const teachingPref    = req.body.teachingPreference || 'Lecture';
      const totalPeriods    = workingWeeks * classesPerWeek;

      const sCode  = subject.code || 'N/A';
      const sName  = typeof subject === 'object' ? subject.name : subject;
      const subjId = typeof subject === 'object' ? subject.id   : subject;

      console.log(`\n[SessionPlan] ══ Generation started ══`);
      console.log(`[SessionPlan] Subject: ${sName} (${sCode}) | Sem: ${semester} | Periods: ${totalPeriods}`);

      // ── 1. Read & extract syllabus ───────────────────────────────────────────
      const subjects = db.readData('subjects');
      const targetSubj = subjects.find(s =>
        s.departmentId === department &&
        s.semester === parseInt(semester, 10) &&
        (s.id === subjId || s.code === sCode)
      );

      let syllabusText = '';
      const SYLLABUS_DIR     = path.resolve(__dirname, '..', '..', 'Subject syabllus');
      const pdfExtractorPath = path.resolve(__dirname, '..', 'services', 'pdfExtractor.py');

      if (targetSubj?.syllabusFile) {
        const { spawnSync } = require('child_process');
        const pdfPath = path.join(SYLLABUS_DIR, targetSubj.syllabusFile);
        if (fs.existsSync(pdfPath) && fs.existsSync(pdfExtractorPath)) {
          console.log(`[SessionPlan] Extracting syllabus from: ${pdfPath}`);
          const result = spawnSync('python', [pdfExtractorPath, pdfPath], {
            encoding: 'utf8', timeout: 20000,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
          });
          syllabusText = result.stdout?.trim() || '';
          if (syllabusText) {
            console.log(`[SessionPlan] Syllabus extracted: ${syllabusText.length} chars`);
          } else {
            console.warn(`[SessionPlan] PDF extraction returned empty`);
          }
        }
      }

      const syllabusSection = syllabusText
        ? `\n\nOFFICIAL SYLLABUS:\n---\n${syllabusText.slice(0, 5000)}\n---`
        : `\n\nNo syllabus PDF available. Generate a standard Anna University syllabus structure for "${sName}" (${sCode}).`;

      // ── 2. AI call helper (Groq primary, Gemini fallback) ───────────────────
      const VALID_METHODS = ['Lecture', 'PPT', 'Discussion', 'Activity', 'Problem Solving', 'Demonstration', 'Case Study', 'Video Session'];
      const VALID_BLOOMS  = ['K1 - Remember', 'K2 - Understand', 'K3 - Apply', 'K4 - Analyze', 'K5 - Evaluate', 'K6 - Create'];

      let usedModel = '';

      const callAIForSessions = async (promptText, label = '') => {
        let rawText = '';

        // Primary: Groq (no daily limit, fast)
        if (process.env.GROQ_API_KEY) {
          try {
            console.log(`[SessionPlan][${label}] Calling Groq llama-3.3-70b...`);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 90000); // 90s timeout
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              signal: controller.signal,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: promptText }],
                temperature: 0.3,
                max_tokens: 8192,
                response_format: { type: 'json_object' }
              })
            });
            clearTimeout(timer);
            if (groqRes.ok) {
              const groqData = await groqRes.json();
              rawText = groqData?.choices?.[0]?.message?.content || '';
              if (rawText) {
                usedModel = 'groq/llama-3.3-70b-versatile';
                console.log(`[SessionPlan][${label}] Groq OK — ${rawText.length} chars`);
              } else {
                console.warn(`[SessionPlan][${label}] Groq returned empty content`);
              }
            } else {
              const errBody = await groqRes.json().catch(() => ({}));
              console.error(`[SessionPlan][${label}] Groq HTTP ${groqRes.status}:`, JSON.stringify(errBody).slice(0, 200));
            }
          } catch (groqErr) {
            console.error(`[SessionPlan][${label}] Groq error: ${groqErr.message}`);
          }
        }

        // Fallback: Gemini
        if (!rawText && process.env.GEMINI_API_KEY && ai) {
          try {
            console.log(`[SessionPlan][${label}] Falling back to Gemini 2.5 Flash...`);
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: promptText,
              config: { responseMimeType: 'application/json' }
            });
            if (response?.text) {
              rawText = response.text;
              usedModel = 'gemini-2.5-flash';
              console.log(`[SessionPlan][${label}] Gemini OK — ${rawText.length} chars`);
            }
          } catch (gemErr) {
            console.warn(`[SessionPlan][${label}] Gemini error: ${gemErr.message}`);
          }
        }

        return rawText;
      };

      // ── 3. JSON parser with repair ───────────────────────────────────────────
      const safeParseSessionsJSON = (raw, label = '') => {
        if (!raw) return null;
        // Strip markdown fences
        let cleaned = raw
          .replace(/^```json\s*/im, '')
          .replace(/^```\s*/im, '')
          .replace(/```\s*$/im, '')
          .trim();

        // Attempt 1: direct parse
        try {
          const p = JSON.parse(cleaned);
          if (Array.isArray(p.sessions) && p.sessions.length > 0) return p;
          if (Array.isArray(p)) return { sessions: p }; // bare array
        } catch (_) {}

        // Attempt 2: repair truncated JSON by finding last complete session object
        try {
          const lastBrace = cleaned.lastIndexOf('"}');
          if (lastBrace > 0) {
            let repaired = cleaned.slice(0, lastBrace + 2);
            // Close open array and object
            const openBracket = (repaired.match(/\[/g) || []).length;
            const closeBracket = (repaired.match(/\]/g) || []).length;
            if (openBracket > closeBracket) repaired += ']';
            const openBrace = (repaired.match(/\{/g) || []).length;
            const closeBrace = (repaired.match(/\}/g) || []).length;
            if (openBrace > closeBrace) repaired += '}';
            const p = JSON.parse(repaired);
            if (Array.isArray(p.sessions) && p.sessions.length > 0) {
              console.warn(`[SessionPlan][${label}] JSON repaired — recovered ${p.sessions.length} sessions`);
              return p;
            }
          }
        } catch (_) {}

        console.error(`[SessionPlan][${label}] JSON parse failed. First 400 chars: ${cleaned.slice(0, 400)}`);
        return null;
      };

      // ── 4. Session validator & field fixer ──────────────────────────────────
      const validateAndFix = (sessions, totalExpected) => {
        let fixCount = 0;
        const perUnitPeriods = Math.floor(totalExpected / 5);

        const fixed = sessions.map((s, idx) => {
          const unit = s.unit || (Math.floor(idx / perUnitPeriods) + 1);
          const co   = s.co   || `CO${Math.min(unit, 5)}`;

          let blooms = s.blooms || '';
          if (!VALID_BLOOMS.some(b => blooms.startsWith(b.slice(0, 2)))) {
            blooms = VALID_BLOOMS[idx % 4]; // cycle K1–K4
            fixCount++;
          }

          let method = s.method || '';
          if (!VALID_METHODS.includes(method)) {
            method = teachingPref || 'Lecture';
            fixCount++;
          }

          const topic = (s.topic || '').trim() || `Topic ${idx + 1} — ${sName}`;
          const subTopic = (s.subTopic || '').trim();
          const fullTopic = subTopic && !topic.includes(subTopic) ? `${topic} — ${subTopic}` : topic;

          if (!s.topic) fixCount++;

          return {
            period:         s.period          || (idx + 1),
            unit:           unit,
            topic:          fullTopic,
            learningOutcome: (s.learningOutcome || s.outcome || '').trim()
                              || `Apply knowledge of ${topic} to solve relevant problems`,
            co:             co,
            blooms:         blooms || 'K2 - Understand',
            method:         method,
            ref:            (s.ref || s.reference || 'T1').trim()
          };
        });

        if (fixCount > 0) {
          console.log(`[SessionPlan][Validator] Auto-fixed ${fixCount} field(s) across ${fixed.length} sessions`);
        }
        return fixed;
      };

      // ── 5. Build prompt for a range of units ────────────────────────────────
      const buildPrompt = (fromUnit, toUnit, fromPeriod, toPeriod, periodsForUnits) => {
        const unitLines = [];
        for (let u = fromUnit; u <= toUnit; u++) {
          const pCount = periodsForUnits[u - 1] || Math.floor(totalPeriods / 5);
          unitLines.push(`  - Unit ${u} → ${pCount} periods → CO${u}`);
        }

        return `You are an expert Anna University professor creating a detailed period-by-period Session Work Plan.

Subject: ${sName} (${sCode})
Department: ${department} Engineering
Semester: ${semester}
Regulation: ${regulation}
Academic Year: ${academicYear}
Preferred Teaching Method: ${teachingPref}
${syllabusSection}

TASK: Generate the session plan for Units ${fromUnit} to ${toUnit}.
Period range: Period ${fromPeriod} to Period ${toPeriod}.
Unit → Period allocation:
${unitLines.join('\n')}

STRICT RULES:
1. Return ONLY a valid JSON object with key "sessions" — an array of exactly ${toPeriod - fromPeriod + 1} objects.
2. Period numbers MUST run sequentially from ${fromPeriod} to ${toPeriod}.
3. Every session object MUST have ALL of these keys:
   - "period": integer (${fromPeriod}–${toPeriod})
   - "unit": integer (${fromUnit}–${toUnit})
   - "topic": string — exact lecture topic from the syllabus
   - "subTopic": string — specific sub-topic or concept covered this period
   - "learningOutcome": string — specific measurable outcome (e.g. "Define and compare RISC vs CISC architectures")
   - "co": string — e.g. "CO${fromUnit}"
   - "blooms": string — MUST be one of: "K1 - Remember", "K2 - Understand", "K3 - Apply", "K4 - Analyze", "K5 - Evaluate", "K6 - Create"
   - "method": string — MUST be one of: "Lecture", "PPT", "Discussion", "Activity", "Problem Solving", "Demonstration", "Case Study", "Video Session"
   - "ref": string — e.g. "T1: Ch-2" or "R1: Ch-4"
4. Cover all syllabus topics in chronological order. Do NOT repeat the same topic consecutively.
5. Vary the teaching methods across periods — do NOT use the same method for every row.
6. No markdown, no explanation text, no code blocks. Return raw JSON only.

Return JSON now:`;
      };

      // ── 6. Calculate per-unit period allocation ──────────────────────────────
      const periodsPerUnit = Array(5).fill(0).map((_, i) => {
        const base = Math.floor(totalPeriods / 5);
        return i < (totalPeriods % 5) ? base + 1 : base;
      });

      console.log(`[SessionPlan] Period allocation per unit: ${periodsPerUnit.join(', ')}`);

      // ── 7. Generate sessions (chunked if > 40 periods) ───────────────────────
      let allSessions = [];

      const CHUNK_THRESHOLD = 40;

      if (totalPeriods <= CHUNK_THRESHOLD) {
        // Single call — all 5 units at once
        console.log(`[SessionPlan] [1/1] Generating all ${totalPeriods} periods in single call...`);
        const prompt = buildPrompt(1, 5, 1, totalPeriods, periodsPerUnit);
        let raw = await callAIForSessions(prompt, 'Chunk1');

        let parsed = safeParseSessionsJSON(raw, 'Chunk1');
        if (!parsed) {
          console.warn(`[SessionPlan] Attempt 1 failed — retrying...`);
          raw = await callAIForSessions(prompt, 'Chunk1-Retry');
          parsed = safeParseSessionsJSON(raw, 'Chunk1-Retry');
        }

        if (parsed?.sessions) {
          allSessions = parsed.sessions;
        }
      } else {
        // Two calls: Units 1–3, then Units 4–5
        const periods123 = periodsPerUnit[0] + periodsPerUnit[1] + periodsPerUnit[2];
        const periods45  = periodsPerUnit[3] + periodsPerUnit[4];
        const startPeriod45 = periods123 + 1;

        console.log(`[SessionPlan] [1/2] Generating Units 1–3 (${periods123} periods)...`);
        const prompt1 = buildPrompt(1, 3, 1, periods123, periodsPerUnit);
        let raw1 = await callAIForSessions(prompt1, 'Batch1');
        let parsed1 = safeParseSessionsJSON(raw1, 'Batch1');
        if (!parsed1) {
          console.warn(`[SessionPlan] Batch1 attempt 1 failed — retrying...`);
          raw1 = await callAIForSessions(prompt1, 'Batch1-Retry');
          parsed1 = safeParseSessionsJSON(raw1, 'Batch1-Retry');
        }

        console.log(`[SessionPlan] [2/2] Generating Units 4–5 (${periods45} periods)...`);
        const prompt2 = buildPrompt(4, 5, startPeriod45, totalPeriods, periodsPerUnit);
        let raw2 = await callAIForSessions(prompt2, 'Batch2');
        let parsed2 = safeParseSessionsJSON(raw2, 'Batch2');
        if (!parsed2) {
          console.warn(`[SessionPlan] Batch2 attempt 1 failed — retrying...`);
          raw2 = await callAIForSessions(prompt2, 'Batch2-Retry');
          parsed2 = safeParseSessionsJSON(raw2, 'Batch2-Retry');
        }

        const sessions1 = parsed1?.sessions || [];
        const sessions2 = parsed2?.sessions || [];
        allSessions = [...sessions1, ...sessions2];
        console.log(`[SessionPlan] Merged: ${sessions1.length} + ${sessions2.length} = ${allSessions.length} sessions`);
      }

      // ── 8. Validate & fix all sessions ──────────────────────────────────────
      let validSessions = [];

      if (allSessions.length > 0) {
        validSessions = validateAndFix(allSessions, totalPeriods);
        console.log(`[SessionPlan] ✓ Validated ${validSessions.length} sessions`);
      } else {
        // Full fallback — generate structured mock data
        console.warn(`[SessionPlan] AI returned no sessions — generating structured fallback`);
        const unitNames = [
          `Introduction and Fundamentals of ${sName}`,
          `Core Concepts and Principles`,
          `Advanced Topics and Applications`,
          `System Integration and Design`,
          `Analysis, Evaluation and Case Studies`
        ];
        const methods = [teachingPref, 'PPT', 'Discussion', 'Problem Solving', 'Demonstration', 'Case Study'];

        let cumPeriod = 1;
        for (let u = 0; u < 5; u++) {
          const uPeriods = periodsPerUnit[u];
          for (let p = 0; p < uPeriods; p++) {
            let topic = '';
            if (p === 0) topic = `Unit ${u+1} Introduction: ${unitNames[u]}`;
            else if (p === uPeriods - 1) topic = `Unit ${u+1} Summary and Review`;
            else topic = `${unitNames[u]} — Part ${p}`;

            validSessions.push({
              period:          cumPeriod++,
              unit:            u + 1,
              topic:           topic,
              learningOutcome: `Understand and apply concepts of Unit ${u+1}`,
              co:              `CO${u+1}`,
              blooms:          VALID_BLOOMS[p % 4],
              method:          methods[p % methods.length],
              ref:             `T1: Ch-${u+1}`
            });
          }
        }
      }

      // ── 9. Enforce exact period count ────────────────────────────────────────
      if (validSessions.length > totalPeriods) {
        validSessions = validSessions.slice(0, totalPeriods);
        console.log(`[SessionPlan] Trimmed to ${totalPeriods} sessions`);
      }
      while (validSessions.length < totalPeriods) {
        const idx = validSessions.length;
        const unit = Math.floor(idx / (totalPeriods / 5)) + 1;
        validSessions.push({
          period: idx + 1,
          unit: Math.min(unit, 5),
          topic: `Additional Session ${idx + 1} — ${sName}`,
          learningOutcome: `Reinforce concepts of Unit ${Math.min(unit, 5)}`,
          co: `CO${Math.min(unit, 5)}`,
          blooms: 'K2 - Understand',
          method: teachingPref || 'Lecture',
          ref: 'T1'
        });
      }

      console.log(`[SessionPlan] ✓ Final: ${validSessions.length} sessions ready`);

      // ── 10. Build response payload ───────────────────────────────────────────
      const parsedData = {
        success:         true,
        workingWeeks,
        classesPerWeek,
        totalPeriods,
        classDuration,
        academicYear,
        sessions:        validSessions
      };

      // ── 11. Log to DB ────────────────────────────────────────────────────────
      try {
        const generations = db.readData('generatedContent');
        generations.push({
          id:           'GEN' + Date.now(),
          subjectCode:  sCode,
          subjectName:  sName,
          departmentId: department,
          semester:     parseInt(semester, 10),
          regulation,
          type:         'sessionplan',
          content:      JSON.stringify(parsedData),
          generatedBy:  generatedBy || 'faculty',
          timestamp:    new Date().toISOString(),
          wordCount:    validSessions.length * 15,
          model:        usedModel || 'structured-fallback'
        });
        db.writeData('generatedContent', generations);
        console.log(`[SessionPlan] ✓ Logged to DB | Model: ${usedModel || 'fallback'}`);
      } catch (saveError) {
        console.error('[SessionPlan] DB log error:', saveError.message);
      }

      console.log(`[SessionPlan] ══ Complete. Sending HTTP 200 ══\n`);
      return res.status(200).json(parsedData);
    }

    // Check if at least one API key is set

    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Neither GEMINI_API_KEY nor GROQ_API_KEY is configured on the server' });
    }

    const sCode = subject.code || 'N/A';
    const sName = typeof subject === 'object' ? subject.name : subject;

    console.log(`AI Request: Type=${type} for ${sName} (${department}, Sem ${semester}, Reg ${regulation})`);

    let promptInstruction = '';
    switch (type) {
      case 'cia1':
        promptInstruction = `Generate a Continuous Internal Assessment 1 (CIA 1) question paper.
        Syllabus Coverage: First half of the syllabus (Unit 1 fully, Unit 2 fully, and the first half of Unit 3).
        
        Total Marks: 60 Marks
        Time Allowed: 2 Hours
        
        Format the question paper strictly as follows (ONLY Part A and Part B, NO Part C):
        
        ### Part A (10 x 2 = 20 Marks)
        ANSWER ALL THE QUESTIONS
        * 10 questions (Questions 1 to 10), each worth 2 marks.
        * Format each question as: "1. <question text>"
        * Questions 1-2 should map to CO3, Questions 3-6 to CO4, Questions 7-10 to CO5.
        * Provide brief, clear questions covering Units 1, 2, and the first half of Unit 3. Do not include answers.
        
        ### Part B (2 x 16 = 32 Marks & 1 x 8 = 8 Marks)
        ANSWER ALL THE QUESTIONS
        * This section has 3 questions (Q11, Q12, Q13), each with Either/Or options (a or b).
        * Question 11 (16 marks, CO4, K4):
          - 11a. Single comprehensive question for 16 marks.
          - OR
          - 11b. Single comprehensive question for 16 marks.
        * Question 12 (16 marks, CO5, K3):
          - 12a. Single comprehensive question for 16 marks.
          - OR
          - 12b. Single comprehensive question for 16 marks.
        * Question 13 (8 marks, CO3, K3):
          - 13a. Analytical/application question for 8 marks.
          - OR
          - 13b. Analytical/application question for 8 marks.
          
        IMPORTANT: Total marks must be exactly 60 (Part A: 20 + Part B: 32 + 8 = 40). There is NO Part C. Question 13 is inside Part B.
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      case 'cia2':
        promptInstruction = `Generate a Continuous Internal Assessment 2 (CIA 2) question paper.
        Syllabus Coverage: Second half of the syllabus (remaining topics of Unit 3 fully, Unit 4 fully, and Unit 5 fully).
        
        Total Marks: 60 Marks
        Time Allowed: 2 Hours
        
        Format the question paper strictly as follows (ONLY Part A and Part B, NO Part C):
        
        ### Part A (10 x 2 = 20 Marks)
        ANSWER ALL THE QUESTIONS
        * 10 questions (Questions 1 to 10), each worth 2 marks.
        * Format each question as: "1. <question text>"
        * Questions 1-2 should map to CO3, Questions 3-6 to CO4, Questions 7-10 to CO5.
        * Provide brief, clear questions covering the second half of Unit 3, Unit 4, and Unit 5. Do not include answers.
        
        ### Part B (2 x 16 = 32 Marks & 1 x 8 = 8 Marks)
        ANSWER ALL THE QUESTIONS
        * This section has 3 questions (Q11, Q12, Q13), each with Either/Or options (a or b).
        * Question 11 (16 marks, CO4, K4):
          - 11a. Single comprehensive question for 16 marks.
          - OR
          - 11b. Single comprehensive question for 16 marks.
        * Question 12 (16 marks, CO5, K3):
          - 12a. Single comprehensive question for 16 marks.
          - OR
          - 12b. Single comprehensive question for 16 marks.
        * Question 13 (8 marks, CO3, K3):
          - 13a. Analytical/application question for 8 marks.
          - OR
          - 13b. Analytical/application question for 8 marks.
          
        IMPORTANT: Total marks must be exactly 60 (Part A: 20 + Part B: 32 + 8 = 40). There is NO Part C. Question 13 is inside Part B.
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      case 'qbank':
        promptInstruction = `Generate a comprehensive Question Bank covering all 5 units of the syllabus.
        For each Unit (Unit I to Unit V), you must generate exactly:
        - 5 questions of 2 marks (Short Answer)
        - 4 questions of 16 marks (Long Answer)
        
        Strictly use the following format for each unit:
        
        ### Unit <Roman Numeral>: <Unit Title>
        
        **2-Mark Questions:**
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        
        **16-Mark Questions:**
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        
        Do not include answers. Ensure the questions cover the respective unit syllabus thoroughly.`;
        break;
      case 'quiz':
        promptInstruction = `Generate exactly 15 multiple-choice questions (MCQs) for a quiz.
        Each question must have exactly 4 choices (a, b, c, d) and specify the correct answer.
        
        Strictly use the following format for each question:
        
        Q1. <Question Text>
        a) <Option A>
        b) <Option B>
        c) <Option C>
        d) <Option D>
        Correct: <Option Letter (a, b, c, or d)>
        
        Ensure that the questions cover the subject syllabus comprehensively. Do not include any extra text outside of the questions.`;
        break;
      case 'hots':
        promptInstruction = `Generate exactly 10 Higher Order Thinking Skills (HOTS) questions for each of the 5 Units of the syllabus (a total of 50 questions).
        These questions must require critical analysis, design, evaluation, or application of concepts.
        
        Strictly format the output as follows (reset numbering to 1-10 for each Unit, do not include options, do not include answers):
        
        ### Unit I: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit II: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit III: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit IV: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        ### Unit V: <Unit Title>
        1. <Question Text>
        2. <Question Text>
        3. <Question Text>
        4. <Question Text>
        5. <Question Text>
        6. <Question Text>
        7. <Question Text>
        8. <Question Text>
        9. <Question Text>
        10. <Question Text>
        
        Do not write any introductory or concluding text.`;
        break;
      case 'assignment':
        const assignmentCount = Math.max(1, Math.min(200, req.body.assignmentCount ? parseInt(req.body.assignmentCount, 10) : 5));
        promptInstruction = `Generate exactly ${assignmentCount} practical assignment questions/scenarios (maximum ${assignmentCount}) that require students to research, analyze, or build something related to this subject.
        
        Strictly format the output as a numbered list from 1 to ${assignmentCount}:
        1. <Question/Scenario Text>
        2. <Question/Scenario Text>
        ...
        ${assignmentCount}. <Question/Scenario Text>
        
        Do not write any introductory or concluding text.`;
        break;
      case 'beyond':
        promptInstruction = `Generate exactly 5 relevant "Beyond-the-Syllabus" topics for each of the 5 Units of the syllabus (a total of 25 topics).
        These topics must be highly relevant to current industry trends and modern technologies related to this subject.
        
        Strictly format the output as follows (do not skip any Unit, ensure all 5 units are generated, and numbering runs sequentially from 1 to 25 across the entire document):
        
        ### Unit I: <Unit Title>
        Beyond-the-Syllabus Topics:
        1. <Topic Name> Ã¢â‚¬â€œ <Brief description of why it is important and its real-world application>
        2. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        3. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        4. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        5. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        
        ### Unit II: <Unit Title>
        Beyond-the-Syllabus Topics:
        6. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        7. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        8. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        9. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        10. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        
        ### Unit III: <Unit Title>
        Beyond-the-Syllabus Topics:
        11. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        12. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        13. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        14. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        15. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        
        ### Unit IV: <Unit Title>
        Beyond-the-Syllabus Topics:
        16. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        17. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        18. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        19. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        20. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        
        ### Unit V: <Unit Title>
        Beyond-the-Syllabus Topics:
        21. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        22. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        23. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        24. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        25. <Topic Name> Ã¢â‚¬â€œ <Brief description>
        
        Do not write any introductory or concluding text. Write the content directly matching the requested structure.`;
        break;
      case 'labmanual':
        promptInstruction = `Generate a comprehensive Lab Manual for this laboratory subject.
        Include a list of 10 structured experiments. For each experiment, provide:
        1. Experiment Number & Title
        2. Aim/Objective
        3. Apparatus/Software Tools Required
        4. Theory/Principle
        5. Algorithm/Procedure
        6. Sample/Expected Code or Structure
        7. Expected Output
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      case 'coursefile':
        promptInstruction = `Generate a complete Course File document structure for this subject.
        Include the following sections:
        1. Course Overview and Syllabus
        2. Course Objectives & Course Outcomes (COs)
        3. CO-PO Mapping Matrix
        4. Detailed Lesson Plan & Lecture Schedule (Unit 1 to 5)
        5. Assessment & Evaluation Sheet Layout
        6. Reference Books & Web Resources
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      case 'syllabus':
        promptInstruction = `Generate the complete academic Syllabus for this subject.
        Divide the syllabus into 5 Units (Unit I to Unit V). For each unit, provide:
        1. Unit Title
        2. Detailed List of Topics and Subtopics
        3. Hours required (e.g., 9 hours per unit)
        At the end of the syllabus, list:
        - Text Books (minimum 2)
        - Reference Books (minimum 3)
        Format the output cleanly in professional academic layout using Markdown.`;
        break;
      default:
        promptInstruction = 'Generate general academic content for this subject.';
    }

    const prompt = `
    You are an expert academic professor.
    
    Subject: ${sCode} - ${sName}
    Department: ${department} Engineering
    Semester: ${semester}
    Academic Regulation: ${regulation}
    
    Task: ${promptInstruction}
    
    STRICT INSTRUCTIONS:
    - Generate only question text.
    - Do NOT append CO mappings.
    - Do NOT append Bloom's taxonomy levels.
    - Do NOT append (COx) or (Kx) inside question statements.
    - CO and K values will be handled separately by the application.
    
    Format the output cleanly in Markdown format. Do not use generic introductions, just provide the content directly.
    `;

    let generatedText = '';
    let usedModel = '';

    // --- Dual Model Execution Logic ---

    // 1. Attempt Primary Model: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Attempting primary generation via Gemini 2.5 Flash...');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response && response.text) {
          generatedText = response.text;
          usedModel = 'gemini-2.5-flash';
          console.log('Gemini generation successful!');
        }
      } catch (geminiError) {
        console.warn('Gemini primary generation failed. Error:', geminiError.message);
      }
    }

    // 2. Fallback to Secondary Model: Groq (Llama 3.3 70B)
    if (!generatedText && process.env.GROQ_API_KEY) {
      try {
        console.log('Attempting secondary fallback generation via Groq (llama-3.3-70b-versatile)...');
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          if (groqData.choices && groqData.choices[0] && groqData.choices[0].message) {
            generatedText = groqData.choices[0].message.content;
            usedModel = 'groq/llama-3.3-70b-versatile';
            console.log('Groq fallback generation successful!');
          }
        } else {
          const errData = await groqResponse.json();
          console.error('Groq API error response:', errData);
        }
      } catch (groqError) {
        console.error('Groq secondary fallback generation failed. Error:', groqError.message);
      }
    }

    // Handle case where both providers failed
    if (!generatedText) {
      return res.status(502).json({
        success: false,
        error: 'Failed to generate content',
        details: 'Both primary model (Gemini) and secondary model (Groq) failed or returned empty results.'
      });
    }

    // Estimate word count
    const wordCount = generatedText.trim().split(/\s+/).length;

    // Save transaction logs
    try {
      const generations = db.readData('generatedContent');
      const newGeneration = {
        id: 'GEN' + Date.now(),
        subjectCode: sCode,
        subjectName: sName,
        departmentId: department,
        semester: parseInt(semester, 10),
        regulation: regulation,
        type: type,
        content: generatedText,
        generatedBy: generatedBy || 'anonymous',
        timestamp: new Date().toISOString(),
        wordCount: wordCount,
        model: usedModel
      };
      generations.push(newGeneration);
      db.writeData('generatedContent', generations);
    } catch (saveError) {
      console.error('Failed to log generated content to database:', saveError);
    }

    res.status(200).json({
      success: true,
      generatedText,
      model: usedModel
    });

  } catch (error) {
    console.error('General server error in generateContent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content',
      details: error.message
    });
  }
};

exports.generateLabManual = async (req, res) => {
  const { spawnSync } = require('child_process');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  SHARED UTILITIES
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Strip markdown fences and parse JSON safely */
  const safeParseJSON = (raw, label = '') => {
    if (!raw) return null;
    const cleaned = raw
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/```\s*$/im, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error(`[LabManual][${label}] JSON parse error: ${e.message}`);
      console.error(`[LabManual][${label}] First 400 chars: ${cleaned.slice(0, 400)}`);
      return null;
    }
  };

  /** Call Groq with a given API key, model, prompt, and token limit */
  const callGroq = async (apiKey, prompt, maxTokens = 4096, label = '') => {
    if (!apiKey) {
      console.warn(`[LabManual][${label}] No Groq API key provided â€” skipping.`);
      return '';
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000); // 50s timeout per agent
    try {
      console.log(`[LabManual][${label}] â†’ Calling Groq (max_tokens=${maxTokens})...`);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' }
        })
      });
      clearTimeout(timer);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error(`[LabManual][${label}] Groq HTTP ${res.status}:`, JSON.stringify(errBody).slice(0, 300));
        return '';
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      console.log(`[LabManual][${label}] âœ“ Groq responded â€” ${text.length} chars`);
      return text;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        console.error(`[LabManual][${label}] âœ— Groq timed out after 50s`);
      } else {
        console.error(`[LabManual][${label}] âœ— Groq error: ${err.message}`);
      }
      return '';
    }
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  AGENT 0 â€” SYLLABUS PARSER (uses GROQ_API_KEY)
  //  Extracts 10 experiment titles + CO + Bloom's level
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const runSyllabusParserAgent = async (syllabusText, subjectCode, subjectName, department, semester, regulation) => {
    console.log('[LabManual][Agent0] === Syllabus Parser Agent starting ===');

    const syllabusSnippet = syllabusText
      ? `\n\nSYLLABUS CONTENT:\n---\n${syllabusText.slice(0, 5000)}\n---`
      : `\n\nNo syllabus file found. Generate titles based on standard Anna University curriculum for "${subjectName}" (${subjectCode}).`;

    const prompt = `You are an academic curriculum assistant for Anna University engineering programs.

Subject: ${subjectName} (${subjectCode})
Department: ${department}
Semester: ${semester}
Regulation: ${regulation}
${syllabusSnippet}

TASK: Extract or generate exactly 10 laboratory experiment titles for this subject.

RULES:
1. Return ONLY a valid JSON object. No explanations, no markdown.
2. Root key must be "titles" â€” an array of exactly 10 objects.
3. Each object must have:
   - "no": integer (1â€“10)
   - "title": string â€” concise lab experiment title
   - "coMapping": string â€” e.g. "CO1", "CO2" ... "CO5"
   - "bloomsTaxonomy": string â€” e.g. "K3 - Apply"
4. If syllabus lists experiments, use them in order. If fewer than 10, add standard practical experiments.
5. Map CO sequentially (CO1 for exp 1-2, CO2 for exp 3-4, etc.).

Return JSON now:`;

    const raw = await callGroq(process.env.GROQ_API_KEY, prompt, 2048, 'Agent0');
    const parsed = safeParseJSON(raw, 'Agent0');

    if (parsed?.titles && Array.isArray(parsed.titles) && parsed.titles.length > 0) {
      // Ensure exactly 10 entries
      let titles = parsed.titles.slice(0, 10);
      const coMap = ['CO1','CO1','CO2','CO2','CO3','CO3','CO4','CO4','CO5','CO5'];
      while (titles.length < 10) {
        const n = titles.length + 1;
        titles.push({ no: n, title: `Experiment ${n} â€” ${subjectName}`, coMapping: coMap[n-1] || 'CO5', bloomsTaxonomy: 'K3 - Apply' });
      }
      console.log(`[LabManual][Agent0] âœ“ Extracted ${titles.length} titles: ${titles.map(t => t.title).join(' | ')}`);
      return titles;
    }

    // Fallback: generic titles
    console.warn('[LabManual][Agent0] âœ— Parse failed â€” using generic titles.');
    return Array.from({ length: 10 }, (_, i) => ({
      no: i + 1,
      title: `Experiment ${i + 1} â€” ${subjectName} Practical`,
      coMapping: ['CO1','CO1','CO2','CO2','CO3','CO3','CO4','CO4','CO5','CO5'][i],
      bloomsTaxonomy: 'K3 - Apply'
    }));
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  AGENTS 1â€“10 â€” EXPERIMENT CONTENT AGENTS (uses GROQ_API_KEY_2)
  //  Each agent generates ONE complete experiment
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const runExperimentAgent = async (expMeta, subjectName, subjectCode, department, semester, agentKey) => {
    const label = `Agent${expMeta.no}`;
    console.log(`[LabManual][${label}] === Experiment Agent starting: "${expMeta.title}" ===`);

    // Use Key 2 if available, fall back to Key 1
    const groqKey = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;

    const prompt = `You are an expert lab manual writer for Anna University engineering practical courses.

Generate the complete content for ONE laboratory experiment.

Experiment Details:
- Experiment No: ${expMeta.no}
- Title: ${expMeta.title}
- Subject: ${subjectName} (${subjectCode})
- Department: ${department}, Semester: ${semester}
- CO Mapping: ${expMeta.coMapping}
- Bloom's Taxonomy: ${expMeta.bloomsTaxonomy}

RULES:
1. Return ONLY a valid JSON object. No markdown, no explanation.
2. All fields must have real, substantive content â€” never placeholder text.
3. Required JSON structure:
{
  "experimentNo": ${expMeta.no},
  "title": "${expMeta.title}",
  "aim": "Clear 1-2 sentence aim statement",
  "objectives": "3 bullet-point objectives as a single string",
  "theory": "Detailed theory â€” minimum 250 words, maximum 400 words",
  "requirements": "Combined list of all lab requirements as a string",
  "softwareRequired": "List of software tools, or None",
  "hardwareRequired": "List of hardware components, or None",
  "algorithm": "Numbered step-by-step algorithm as a string, or Not applicable",
  "procedure": ["Step 1 ...", "Step 2 ...", "Step 3 ...", "Step 4 ...", "Step 5 ...", "Step 6 ..."],
  "program": "Complete working source code â€” not a placeholder",
  "sampleInput": "Realistic input values",
  "sampleOutput": "Expected output description",
  "observations": "What to observe and record",
  "result": "Standard result statement confirming successful completion",
  "vivaQuestions": [
    {"question": "Q1?", "answer": "A1."},
    {"question": "Q2?", "answer": "A2."},
    {"question": "Q3?", "answer": "A3."},
    {"question": "Q4?", "answer": "A4."},
    {"question": "Q5?", "answer": "A5."},
    {"question": "Q6?", "answer": "A6."},
    {"question": "Q7?", "answer": "A7."},
    {"question": "Q8?", "answer": "A8."},
    {"question": "Q9?", "answer": "A9."},
    {"question": "Q10?", "answer": "A10."}
  ],
  "bloomsTaxonomy": "${expMeta.bloomsTaxonomy}",
  "coMapping": "${expMeta.coMapping}",
  "precautions": "2-3 safety or accuracy precautions",
  "applications": "2-3 real-world applications",
  "learningOutcome": "What the student gains from this experiment",
  "references": "2-3 textbook or online references"
}

Return the JSON now:`;

    const raw = await callGroq(groqKey, prompt, 4096, label);
    let parsed = safeParseJSON(raw, label);

    // Retry once if parse fails
    if (!parsed || !parsed.title) {
      console.warn(`[LabManual][${label}] âœ— Attempt 1 failed â€” retrying...`);
      const raw2 = await callGroq(groqKey, prompt, 4096, `${label}-Retry`);
      parsed = safeParseJSON(raw2, `${label}-Retry`);
    }

    if (parsed && parsed.title) {
      // Ensure experimentNo is correct
      parsed.experimentNo = expMeta.no;
      if (!Array.isArray(parsed.procedure)) {
        parsed.procedure = [parsed.procedure || 'Follow standard procedure.'];
      }
      if (!Array.isArray(parsed.vivaQuestions)) {
        parsed.vivaQuestions = [];
      }
      console.log(`[LabManual][${label}] âœ“ Experiment "${parsed.title}" generated successfully`);
      return parsed;
    }

    // Both attempts failed â€” return minimal default
    console.error(`[LabManual][${label}] âœ— Both attempts failed â€” using fallback placeholder`);
    return {
      experimentNo: expMeta.no,
      title: expMeta.title,
      aim: `To study and implement ${expMeta.title}.`,
      objectives: `1. Understand the concept of ${expMeta.title}.\n2. Implement it practically.\n3. Analyze the output.`,
      theory: `This experiment covers ${expMeta.title} which is an important part of ${subjectName}. Students will implement and observe the working principles during the lab session.`,
      requirements: 'Standard laboratory equipment and software',
      softwareRequired: 'As applicable to the subject',
      hardwareRequired: 'As applicable to the subject',
      algorithm: 'Step 1: Start\nStep 2: Initialize\nStep 3: Execute\nStep 4: Observe\nStep 5: Stop',
      procedure: ['Set up the experiment.', 'Initialize the required tools.', 'Execute the program or circuit.', 'Observe and record results.', 'Verify expected output.', 'Conclude the experiment.'],
      program: `# Program for ${expMeta.title}\n# Implementation based on subject curriculum`,
      sampleInput: 'Refer to lab worksheet',
      sampleOutput: 'Refer to lab worksheet',
      observations: 'Record all observations in the observation table provided.',
      result: `The experiment "${expMeta.title}" was successfully completed and the results were verified.`,
      vivaQuestions: Array.from({ length: 10 }, (_, i) => ({
        question: `What is the significance of step ${i + 1} in this experiment?`,
        answer: `Step ${i + 1} is important because it ensures proper execution of ${expMeta.title}.`
      })),
      bloomsTaxonomy: expMeta.bloomsTaxonomy || 'K3 - Apply',
      coMapping: expMeta.coMapping || 'CO1',
      precautions: 'Follow standard lab safety procedures. Verify connections before power-on. Handle equipment carefully.',
      applications: `${expMeta.title} is used in real-world systems for practical engineering applications.`,
      learningOutcome: `Students will understand and implement ${expMeta.title} practically.`,
      references: 'Standard textbooks, Anna University lab manual, and online resources.'
    };
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  VALIDATOR AGENT â€” ensures all 10 experiments are complete
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const runValidatorAgent = (experiments, subjectName) => {
    console.log('[LabManual][Validator] === Validator Agent running ===');
    let fixCount = 0;

    experiments.forEach((exp, idx) => {
      const n = idx + 1;
      if (!exp.title || exp.title.trim().length < 3) { exp.title = `Experiment ${n}`; fixCount++; }
      if (!exp.aim || exp.aim.trim().length < 10) { exp.aim = `To study ${exp.title} related to ${subjectName}.`; fixCount++; }
      if (!exp.theory || exp.theory.trim().length < 30) { exp.theory = `This experiment on ${exp.title} is part of the ${subjectName} curriculum and covers practical implementation concepts.`; fixCount++; }
      if (!Array.isArray(exp.procedure) || exp.procedure.length < 2) {
        exp.procedure = ['Set up the experiment.', 'Execute and observe.', 'Record your findings.', 'Verify the results.'];
        fixCount++;
      }
      if (!exp.program || exp.program.trim().length < 5) { exp.program = `# ${exp.title}\n# Program implementation`; fixCount++; }
      if (!Array.isArray(exp.vivaQuestions) || exp.vivaQuestions.length < 5) {
        exp.vivaQuestions = Array.from({ length: 10 }, (_, i) => ({
          question: `What is the purpose of ${exp.title}?`.replace('the purpose', `concept ${i + 1}`),
          answer: `It demonstrates key principles of ${subjectName} practically.`
        }));
        fixCount++;
      }
      if (!exp.result) { exp.result = `The experiment "${exp.title}" was completed successfully.`; fixCount++; }
      // Ensure experimentNo is set correctly
      exp.experimentNo = n;
    });

    console.log(`[LabManual][Validator] âœ“ Validation complete â€” ${fixCount} field(s) auto-filled`);
    return experiments;
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  //  MAIN ORCHESTRATOR
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  try {
    const { department, regulation, semester, subject, generatedBy } = req.body;
    const syllabusBase64 = req.body.syllabusBase64 || req.body.syllabusPdf || '';

    console.log('\n[LabManual] â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('[LabManual] â•‘   MULTI-AGENT LAB MANUAL PIPELINE START  â•‘');
    console.log('[LabManual] â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.log(`[LabManual] dept=${department} | sem=${semester} | regulation=${regulation}`);
    console.log(`[LabManual] subject=${JSON.stringify(subject)}`);
    console.log(`[LabManual] GROQ_API_KEY present: ${!!process.env.GROQ_API_KEY}`);
    console.log(`[LabManual] GROQ_API_KEY_2 present: ${!!process.env.GROQ_API_KEY_2}`);

    // â”€â”€ Validate input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!department || !regulation || !semester || !subject) {
      return res.status(400).json({ success: false, error: 'Missing required fields: department, regulation, semester, subject.' });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, error: 'GROQ_API_KEY is not configured on the server.' });
    }

    // â”€â”€ Resolve subject record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.log('\n[LabManual] [1/8] Reading subject from database...');
    const subjects = db.readData('subjects');
    const subjCode = typeof subject === 'object' ? subject.code : subject;
    const subjId   = typeof subject === 'object' ? subject.id   : subject;
    const sName    = typeof subject === 'object' ? subject.name : subject;

    const targetSubj = subjects.find(s =>
      s.departmentId === department &&
      s.semester === parseInt(semester, 10) &&
      (s.id === subjId || s.code === subjCode)
    );

    if (!targetSubj) {
      console.error(`[LabManual] Subject not found â€” dept=${department}, sem=${semester}, code=${subjCode}`);
      return res.status(404).json({ success: false, error: `Subject "${subjCode}" not found for the selected department and semester.` });
    }
    console.log(`[LabManual] âœ“ Subject resolved: "${targetSubj.name}" (${targetSubj.code})`);

    // â”€â”€ Extract syllabus text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.log('\n[LabManual] [2/8] Extracting syllabus text...');
    let syllabusText = '';
    const SYLLABUS_DIR = path.resolve(__dirname, '..', '..', 'Subject syabllus');
    const pdfExtractorPath = path.resolve(__dirname, '..', 'services', 'pdfExtractor.py');
    let tempPdfPath = null;

    if (syllabusBase64) {
      try {
        const base64Data = syllabusBase64.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const tempFilename = `temp_lab_${Date.now()}.pdf`;
        tempPdfPath = path.resolve(__dirname, '..', 'data', tempFilename);
        fs.writeFileSync(tempPdfPath, buffer);
        console.log(`[LabManual] Saved uploaded PDF: ${buffer.length} bytes`);
      } catch (e) {
        console.warn(`[LabManual] Failed to save uploaded PDF: ${e.message}`);
      }
    }

    const pdfPath = tempPdfPath || (targetSubj.syllabusFile ? path.join(SYLLABUS_DIR, targetSubj.syllabusFile) : null);

    if (pdfPath && fs.existsSync(pdfPath) && fs.existsSync(pdfExtractorPath)) {
      const result = spawnSync('python', [pdfExtractorPath, pdfPath], {
        encoding: 'utf8', timeout: 20000,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
      });
      syllabusText = result.stdout?.trim() || '';
      if (syllabusText) {
        console.log(`[LabManual] âœ“ Syllabus text extracted: ${syllabusText.length} characters`);
      } else {
        console.warn(`[LabManual] PDF extraction returned empty. stderr: ${result.stderr?.slice(0, 200) || 'none'}`);
      }
    } else {
      console.warn('[LabManual] No syllabus PDF found â€” AI will generate from subject knowledge.');
    }

    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try { fs.unlinkSync(tempPdfPath); } catch (_) {}
    }

    // â”€â”€ AGENT 0: Syllabus Parser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.log('\n[LabManual] [3/8] Agent 0 â€” Syllabus Parser (extracting 10 titles)...');
    const experimentTitles = await runSyllabusParserAgent(
      syllabusText, subjCode, sName, department, semester, regulation
    );

    // â”€â”€ AGENTS 1â€“10: Experiment Agents (parallel batches of 2)
    console.log('\n[LabManual] [4/8] Agents 1â€“10 â€” Experiment Content Agents starting...');
    const groqKey2 = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;

    if (process.env.GROQ_API_KEY_2) {
      console.log('[LabManual] âœ“ Using GROQ_API_KEY_2 for experiment content agents');
    } else {
      console.warn('[LabManual] âš  GROQ_API_KEY_2 not set â€” both agents using GROQ_API_KEY');
    }

    const experiments = new Array(10).fill(null);

    // Run in batches of 2 for rate limit safety
    const BATCH_SIZE = 2;
    for (let batchStart = 0; batchStart < 10; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, 10);
      const batchNums = Array.from({ length: batchEnd - batchStart }, (_, i) => batchStart + i);
      console.log(`[LabManual] Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/5: Experiments ${batchNums.map(n => n + 1).join(', ')}...`);

      const batchResults = await Promise.all(
        batchNums.map(idx => runExperimentAgent(
          experimentTitles[idx], sName, subjCode, department, semester, groqKey2
        ))
      );

      batchResults.forEach((result, i) => {
        experiments[batchStart + i] = result;
      });

      // Small delay between batches to respect rate limits
      if (batchEnd < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // â”€â”€ VALIDATOR AGENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.log('\n[LabManual] [5/8] Validator Agent running...');
    const validatedExperiments = runValidatorAgent(experiments, sName);

    // â”€â”€ LOG TO DATABASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.log('\n[LabManual] [6/8] Logging generation to database...');
    try {
      const generations = db.readData('generatedContent');
      generations.push({
        id: 'GEN' + Date.now(),
        subjectCode: subjCode,
        subjectName: sName,
        departmentId: department,
        semester: parseInt(semester, 10),
        regulation,
        type: 'labmanual',
        content: JSON.stringify({ experiments: validatedExperiments }),
        generatedBy: generatedBy || 'faculty',
        timestamp: new Date().toISOString(),
        wordCount: JSON.stringify(validatedExperiments).split(/\s+/).length,
        model: `groq/llama-3.3-70b-versatile (multi-agent: ${process.env.GROQ_API_KEY_2 ? 'dual-key' : 'single-key'})`
      });
      db.writeData('generatedContent', generations);
      console.log('[LabManual] âœ“ Logged to database');
    } catch (dbErr) {
      console.error('[LabManual] DB log failed (non-fatal):', dbErr.message);
    }

    // â”€â”€ SEND RESPONSE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    console.log('\n[LabManual] [7/8] Sending response to frontend...');
    console.log(`[LabManual] âœ“ Total experiments: ${validatedExperiments.length}`);
    console.log(`[LabManual] âœ“ Titles: ${validatedExperiments.map(e => e.title).join(' | ')}`);
    console.log('[LabManual] â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.log('[LabManual] â•‘   PIPELINE COMPLETE â€” HTTP 200 SENT      â•‘');
    console.log('[LabManual] â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

    return res.status(200).json({
      success: true,
      experiments: validatedExperiments,
      totalGenerated: validatedExperiments.length,
      syllabusUsed: !!syllabusText,
      model: 'groq/llama-3.3-70b-versatile',
      agentMode: process.env.GROQ_API_KEY_2 ? 'dual-key-multi-agent' : 'single-key-multi-agent'
    });

  } catch (error) {
    console.error('\n[LabManual] â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
    console.error('[LabManual] â•‘   PIPELINE ERROR                          â•‘');
    console.error('[LabManual] â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    console.error('[LabManual] Error:', error.message);
    console.error('[LabManual] Stack:', error.stack?.split('\n').slice(0, 4).join('\n'));
    return res.status(500).json({
      success: false,
      error: 'Lab manual generation encountered an unexpected error.',
      details: error.message
    });
  }
};

