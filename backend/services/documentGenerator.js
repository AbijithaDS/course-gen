const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const templateService = require('./templateService');
const subjectStaffService = require('./subjectStaffService');

/**
 * Cleans CO and K references from the text to prevent duplication in dedicated columns.
 */
function cleanAllTextOfCOK(text) {
  if (!text) return '';
  
  // 1. Remove parenthesized CO and K references (e.g., "(CO4)", "(K2)", "(CO3, K1)", "(CO4, K4)", "(K4, CO4)")
  let cleaned = text.replace(/\(\s*(?:CO[1-5]|K[1-6])\s*(?:,\s*(?:CO[1-5]|K[1-6]))?\s*\)/gi, '');
  cleaned = cleaned.replace(/\(\s*(?:CO[1-5]|K[1-6])\s*\)/gi, '');
  cleaned = cleaned.replace(/\(\s*(?:CO[1-5]|K[1-6])\s*,\s*(?:CO[1-5]|K[1-6])\s*\)/gi, '');
  cleaned = cleaned.replace(/\(\s*K[1-6]\s*,\s*CO[1-5]\s*\)/gi, '');
  
  // 2. Remove non-parenthesized CO/K references at the end of lines
  // Exclude CO2 and K1 to prevent false matches with Carbon Dioxide (CO2) or Vitamin K1 in sentences.
  cleaned = cleaned.replace(/\s*\b(?:CO[1345]|K[2-6])\b\s*(?=[.?]?\s*(?:\r?\n|$))/gi, (match) => {
    const puncMatch = match.match(/[.?]/);
    return puncMatch ? puncMatch[0] : '';
  });
  
  return cleaned
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Strips markdown formatting emphasis characters (*, _, **) from a string.
 */
function stripMarkdownFormatting(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^[\*_\s]+|[\*_\s]+$/g, (match) => {
      return match.replace(/[\*_]/g, '');
    })
    .trim();
}

/**
 * Normalizes Markdown to clean plain text for DOCX rendering and strips CO/K mappings.
 */
function formatMarkdownForDocx(md) {
  if (!md) return '';
  let cleanMd = stripMarkdownFormatting(md);
  return cleanAllTextOfCOK(cleanMd);
}

// =====================================================================
// QUESTION PARSER — Extracts individual questions from AI-generated text
// =====================================================================

/**
 * Parses AI-generated CIA question paper markdown into individual question placeholders.
 * Returns an object like { Q1: "...", Q2: "...", ..., Q10: "...", Q11a: "...", ..., Q13b: "..." }
 */
function parseQuestions(content) {
  const questions = {};
  if (!content) return questions;

  // Split into sections
  const partAIdx = content.search(/Part\s*A/i);
  const partBIdx = content.search(/Part\s*B/i);
  const partCIdx = content.search(/Part\s*C/i);

  let partAText = '';
  let partBText = '';

  if (partAIdx !== -1) {
    if (partBIdx !== -1) {
      partAText = content.substring(partAIdx, partBIdx);
      if (partCIdx !== -1) {
        partBText = content.substring(partBIdx, partCIdx) + '\n' + content.substring(partCIdx);
      } else {
        partBText = content.substring(partBIdx);
      }
    } else {
      partAText = content.substring(partAIdx);
    }
  } else {
    partAText = content;
    partBText = content;
  }

  const cleanOption = (txt) => {
    if (!txt) return '';
    let cleaned = formatMarkdownForDocx(txt);
    // Remove any trailing/internal "Part C" headings, marks declarations, or instructions
    cleaned = cleaned.replace(/(?:^|\n)\s*#+\s*Part\s*[A-Z].*$/gim, '');
    cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?Answer\s+(?:all|either|any).*$/gim, '');
    cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?\d+\s*x\s*\d+\s*=\s*\d+\s*Marks.*$/gim, '');
    cleaned = cleaned.replace(/(?:^|\n)\s*-+\s*$/gm, '');
    return formatMarkdownForDocx(cleaned);
  };

  // --- Parse Part A ---
  const partALines = partAText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 1; i <= 10; i++) {
    const patterns = [
      new RegExp(`^(?:\\*\\*|\\b)?Q?\\.?\\s*${i}\\s*[\\.\\)]\\s*\\*?\\*?\\s*(.+)`, 'i'),
      new RegExp(`^\\**\\s*Q?\\.?\\s*${i}\\s*[\\.\\):]\\**\\s*(.+)`, 'i')
    ];
    for (const line of partALines) {
      if (line.toLowerCase().includes('answer all') || line.toLowerCase().includes('marks)')) {
        continue;
      }
      let matched = false;
      for (const pat of patterns) {
        const m = line.match(pat);
        if (m) {
          questions[`Q${i}`] = formatMarkdownForDocx(m[1]);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  // --- Parse Part B ---
  const findQuestionSegment = (text, num) => {
    // Try multiple patterns to locate the start of question `num`
    const startPatterns = [
      // **11. (16 Marks)** or **11.** or 11. or Q11 etc.
      new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${num}\\s*[\\.\\):\\(]`, 'i'),
      // Fallback: just the number at line start followed by word boundary or letter
      new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${num}(?:\\b|[a-z])`, 'i')
    ];
    
    let startMatch = null;
    for (const pat of startPatterns) {
      startMatch = text.match(pat);
      if (startMatch) break;
    }
    if (!startMatch) return '';

    const nextNum = num + 1;
    const endPatterns = [
      new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${nextNum}\\s*[\\.\\):\\(]`, 'i'),
      new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${nextNum}(?:\\b|[a-z])`, 'i')
    ];
    
    let endMatch = null;
    for (const pat of endPatterns) {
      endMatch = text.match(pat);
      if (endMatch) break;
    }

    if (endMatch) {
      return text.substring(startMatch.index, endMatch.index);
    } else {
      return text.substring(startMatch.index);
    }
  };

  const parseOption = (segment, letter) => {
    // Multiple regex patterns to handle various AI formatting styles:
    // "a. text", "a) text", "(a) text", "11a. text", "  a. text", etc.
    const lLower = letter.toLowerCase();
    const lUpper = letter.toUpperCase();
    const lClass = `[${lLower}${lUpper}]`;
    const anyClass = `[a-bA-B]`;
    
    const patterns = [
      // Pattern 1: Standard "a." / "a)" / "a:" with optional preceding number
      // Uses case-sensitive matching for OR/Or/**OR** to avoid matching lowercase "or" in text.
      new RegExp(`(?:\\b|\\()\\s*(?:\\d+)?${lClass}\\s*[\\.\\):]\\s*\\*?\\*?\\s*([\\s\\S]+?)(?=(?:\\b|\\()\\s*(?:\\d+)?${anyClass}\\s*[\\.\\):]|\\b(?:OR|Or|\\*\\*OR\\*\\*|\\*\\*Or\\*\\*)\\b|$)`),
      // Pattern 2: Parenthesized "(a)" style
      new RegExp(`\\(${lClass}\\)\\s*\\*?\\*?\\s*([\\s\\S]+?)(?=\\([a-bA-B]\\)|\\b(?:OR|Or|\\*\\*OR\\*\\*|\\*\\*Or\\*\\*)\\b|$)`),
      // Pattern 3: Indented letter with dot/paren, more lenient
      new RegExp(`^\\s+${lClass}\\s*[\\.\\)]\\s*(.+)`, 'm')
    ];

    for (const pat of patterns) {
      const m = segment.match(pat);
      if (m) {
        let txt = m[1].trim();
        txt = txt.replace(/\s+\**OR\**\s*$/i, '');
        return cleanOption(txt);
      }
    }
    return '';
  };

  /**
   * Extracts the full question text from a segment when no a/b sub-options exist.
   * Strips the leading question number, marks info, and formatting cruft.
   */
  const extractFullQuestionText = (segment) => {
    if (!segment) return '';
    let text = segment
      // Remove the leading question number line (e.g., "**11. (16 Marks)**" or "11.")
      .replace(/^\s*\**\s*(?:Question|Q)?\s*\d+\s*[\.\)\:]?\s*(?:\(?\d+\s*Marks?\)?)?\.?\s*\**\s*/i, '')
      // Remove OR markers
      .replace(/\bOR\b/gi, '')
      // Remove marks/instruction lines
      .replace(/^\s*\*?\(?\s*\d+\s*(?:x\s*\d+\s*=\s*)?\d*\s*Marks?\s*\)?\s*\*?\s*$/gim, '')
      .trim();
    return cleanOption(text);
  };

  const partBKeys = [
    { key: '11a', num: 11, letter: 'a' },
    { key: '11b', num: 11, letter: 'b' },
    { key: '12a', num: 12, letter: 'a' },
    { key: '12b', num: 12, letter: 'b' },
    { key: '13a', num: 13, letter: 'a' },
    { key: '13b', num: 13, letter: 'b' }
  ];

  // Group by question number for fallback handling
  const questionNums = [11, 12, 13];
  let anyPartBFound = false;

  for (const num of questionNums) {
    const segment = findQuestionSegment(partBText, num);
    if (!segment) continue;
    anyPartBFound = true;

    const aKey = `Q${num}a`;
    const bKey = `Q${num}b`;
    
    const optA = parseOption(segment, 'a');
    const optB = parseOption(segment, 'b');

    if (optA || optB) {
      // Standard a/b sub-options found
      questions[aKey] = optA;
      questions[bKey] = optB;
    } else {
      // FALLBACK: No a/b sub-options detected — AI output the question as a single block.
      // Place the entire question text into the 'a' slot so it appears in the DOCX.
      const fullText = extractFullQuestionText(segment);
      if (fullText) {
        questions[aKey] = fullText;
        questions[bKey] = ''; // Leave 'b' empty — only one question variant was generated
      }
    }
  }

  // SECONDARY FALLBACK: If no Q11/Q12/Q13 numbering was found at all,
  // the AI may have used relative numbering (e.g., "Question 1:", "Question 2:") 
  // inside the Part B section. Re-try with relative numbers mapped to 11, 12, 13.
  if (!anyPartBFound && partBText) {
    const targetNums = [11, 12, 13];

    // First, try to find "Question N:" labeled segments (preferred — more specific)
    const findLabeledSegment = (text, num) => {
      const startRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*Question\\s+${num}\\s*[:\\.]?\\s*\\**`, 'i');
      const startMatch = text.match(startRegex);
      if (!startMatch) return '';

      const nextNum = num + 1;
      const endRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*Question\\s+${nextNum}\\s*[:\\.]?\\s*\\**`, 'i');
      const endMatch = text.match(endRegex);

      if (endMatch) {
        return text.substring(startMatch.index, endMatch.index);
      }
      return text.substring(startMatch.index);
    };

    let labeledFound = false;
    for (let i = 0; i < 3; i++) {
      const segment = findLabeledSegment(partBText, i + 1);
      if (!segment) continue;
      labeledFound = true;

      const aKey = `Q${targetNums[i]}a`;
      const bKey = `Q${targetNums[i]}b`;

      const optA = parseOption(segment, 'a');
      const optB = parseOption(segment, 'b');

      if (optA || optB) {
        questions[aKey] = optA;
        questions[bKey] = optB;
      } else {
        const fullText = extractFullQuestionText(segment);
        if (fullText) {
          questions[aKey] = fullText;
          questions[bKey] = '';
        }
      }
    }

    // If labeled "Question N" segments weren't found, fall back to bare numbers 1, 2, 3
    if (!labeledFound) {
      for (let i = 0; i < 3; i++) {
        const segment = findQuestionSegment(partBText, i + 1);
        if (!segment) continue;

        const aKey = `Q${targetNums[i]}a`;
        const bKey = `Q${targetNums[i]}b`;

        const optA = parseOption(segment, 'a');
        const optB = parseOption(segment, 'b');

        if (optA || optB) {
          questions[aKey] = optA;
          questions[bKey] = optB;
        } else {
          const fullText = extractFullQuestionText(segment);
          if (fullText) {
            questions[aKey] = fullText;
            questions[bKey] = '';
          }
        }
      }
    }
  }

  return questions;
}

// =====================================================================
// METADATA RESOLVERS — Dynamic placeholders for the official template
// =====================================================================

/**
 * Converts year/semester numbers to Roman numerals for the YEAR_SEM field
 * Example: year=3, semester=6 → "III/VI"
 */
function toRoman(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return String(num);
  const romanMap = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  let remaining = n;
  for (const [value, symbol] of romanMap) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

/**
 * Builds the YEAR_SEM string like "III/VI" from year and semester
 */
function resolveYearSem(year, semester) {
  const y = parseInt(year, 10);
  const s = parseInt(semester, 10);
  if (isNaN(y) && isNaN(s)) return 'N/A';
  const yearRoman = !isNaN(y) ? toRoman(y) : '';
  const semRoman = !isNaN(s) ? toRoman(s) : '';
  if (yearRoman && semRoman) return `${yearRoman}/${semRoman}`;
  if (semRoman) return semRoman;
  return yearRoman || 'N/A';
}

/**
 * Computes academic year string like "2025-2026"
 */
function resolveAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // Academic year starts in June/July
  if (month >= 5) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Maps department ID to display branch name
 */
function resolveBranch(departmentId, departmentName) {
  const branchMap = {
    'AI_DS': 'AI&DS',
    'AIDS': 'AI&DS',
    'CSE': 'CSE',
    'IT': 'IT',
    'ECE': 'ECE',
    'EEE': 'EEE',
    'MECH': 'MECH',
    'CIVIL': 'CIVIL',
    'BME': 'BME',
  };
  return branchMap[departmentId] || departmentName || departmentId || 'N/A';
}

/**
 * Formats regulation display string (e.g., "R2023" → "R-2023")
 */
function resolveRegulation(regulation) {
  if (!regulation) return 'N/A';
  // If already has hyphen, return as-is
  if (regulation.includes('-')) return regulation;
  // Insert hyphen after 'R' prefix
  const match = regulation.match(/^(R)(\d+)$/i);
  if (match) return `${match[1]}-${match[2]}`;
  return regulation;
}

// =====================================================================
// HTML WORD FALLBACK — For non-CIA document types
// =====================================================================

function getDepartmentVM(deptId) {
  const defaultVM = {
    vision: `To produce highly competent, ethical, and socially responsible engineers through quality education and research in the field of engineering.`,
    mission: [
      `To provide state-of-the-art facilities and a modern learning environment.`,
      `To bridge the gap between academia and industry through practical exposure and projects.`,
      `To foster innovative thinking, research aptitude, and lifelong learning.`
    ],
    psos: [
      `Apply discipline-specific engineering knowledge to solve complex technical problems.`,
      `Utilize modern engineering tools and software to design and analyze systems.`,
      `Develop solutions that are economically, environmentally, and ethically sustainable.`
    ]
  };

  const map = {
    'AI_DS': {
      vision: `Envision to have Global recognition by producing high quality, creative and ethical engineers and technologists to contribute effectively through innovations and research excellence in the advancing field of Artificial Intelligence and Data Science.`,
      mission: [
        `M1: To empower the cognitive skills of the students in the pioneering domain of Artificial Intelligence and Data Science by providing content based learning with quality teaching and learning opportunities, industry institute interaction activities and centers of excellence.`,
        `M2: To transform professionals into technically competent to contribute to the society positively by inducing entrepreneurship skills through collaborative teaching, innovations and research.`,
        `M3: To forge partnerships with companies to tackle real-world challenges using AI solutions, facilitating research projects and internships to bridge academia and industry.`
      ],
      psos: [
        `Ability to identify, design and apply domain knowledge and computational skills to evolve novel intelligent solutions for Artificial Intelligence and Data Science related processes in our ecosystem.`,
        `Ability to critique the role of Artificial Intelligence and Data Science in multi-disciplinary areas to transform thoughts into products through research and innovative career.`,
        `Ability to Apply adaptive machine learning algorithms, statistical models, tools and techniques to develop intelligent systems for solving problems from inter-disciplinary domains.`
      ]
    },
    'AIDS': {
      vision: `Envision to have Global recognition by producing high quality, creative and ethical engineers and technologists to contribute effectively through innovations and research excellence in the advancing field of Artificial Intelligence and Data Science.`,
      mission: [
        `M1: To empower the cognitive skills of the students in the pioneering domain of Artificial Intelligence and Data Science by providing content based learning with quality teaching and learning opportunities, industry institute interaction activities and centers of excellence.`,
        `M2: To transform professionals into technically competent to contribute to the society positively by inducing entrepreneurship skills through collaborative teaching, innovations and research.`,
        `M3: To forge partnerships with companies to tackle real-world challenges using AI solutions, facilitating research projects and internships to bridge academia and industry.`
      ],
      psos: [
        `Ability to identify, design and apply domain knowledge and computational skills to evolve novel intelligent solutions for Artificial Intelligence and Data Science related processes in our ecosystem.`,
        `Ability to critique the role of Artificial Intelligence and Data Science in multi-disciplinary areas to transform thoughts into products through research and innovative career.`,
        `Ability to Apply adaptive machine learning algorithms, statistical models, tools and techniques to develop intelligent systems for solving problems from inter-disciplinary domains.`
      ]
    },
    'CSE': {
      vision: `To produce highly competent and ethical computer science professionals through quality education, research, and innovation to meet global challenges.`,
      mission: [
        `M1: To provide state-of-the-art facilities and a learning environment for quality education.`,
        `M2: To foster research, innovation, and entrepreneurship skills in computer science.`,
        `M3: To cultivate professional ethics, team spirit, and social responsibility.`
      ],
      psos: [
        `Apply software engineering principles and practices to develop quality software applications for complex real-world problems.`,
        `Utilize modern tools and platforms including cloud computing and data analytics to design and deploy computer-based systems.`,
        `Adopt secure coding standards and computational practices to build robust IT infrastructure and systems.`
      ]
    },
    'IT': {
      vision: `To be a center of excellence in Information Technology, producing skilled professionals who can innovate and adapt to the dynamic technological landscape.`,
      mission: [
        `M1: To impart comprehensive knowledge in theoretical and applied Information Technology.`,
        `M2: To bridge the academic-industry gap through training, internships, and collaborative projects.`,
        `M3: To nurture research capabilities, ethical values, and lifelong learning attitudes.`
      ],
      psos: [
        `Design and develop efficient web and mobile applications using modern programming frameworks and database technologies.`,
        `Configure, secure, and manage computer network systems and cloud environments for diverse enterprise needs.`,
        `Analyze data and integrate intelligent algorithms to solve problems in information retrieval and processing.`
      ]
    },
    'ECE': {
      vision: `To achieve global standards in Electronics and Communication Engineering education and research, creating competent professionals for industrial and societal needs.`,
      mission: [
        `M1: To provide high-quality academic programs in electronics, communication, and allied domains.`,
        `M2: To encourage research, design innovation, and technical skill development.`,
        `M3: To instill professional ethics, leadership qualities, and social awareness.`
      ],
      psos: [
        `Design and test electronic circuits, embedded systems, and VLSI modules for telecommunication and industrial systems.`,
        `Apply signal processing and communication techniques to solve engineering problems in wireless and network industries.`,
        `Use software design tools and platforms to model, simulate, and analyze electronic systems.`
      ]
    },
    'EEE': {
      vision: `To be a premier department for education and research in Electrical and Electronics Engineering, nurturing ethical leaders and innovators.`,
      mission: [
        `M1: To provide a strong foundation in electrical machines, power systems, and control systems.`,
        `M2: To promote research, hands-on training, and industry-collaborative projects.`,
        `M3: To inculcate engineering ethics, teamwork, and commitment to sustainable environment.`
      ],
      psos: [
        `Analyze, design, and operate power systems, electrical machines, and control modules for sustainable energy.`,
        `Design power electronic converters and motor drives for industrial automation and electric vehicles.`,
        `Use microcontrollers and modern instrumentation tools to develop smart grid and automation solutions.`
      ]
    },
    'MECH': {
      vision: `To produce globally competent and ethical mechanical engineers through quality education, research, and collaborative practices.`,
      mission: [
        `M1: To impart knowledge in design, manufacturing, and thermal engineering.`,
        `M2: To encourage industry visits, practical projects, and research activities.`,
        `M3: To foster professional leadership, business ethics, and lifelong learning.`
      ],
      psos: [
        `Design mechanical systems and components using CAD/CAM tools and finite element analysis methods.`,
        `Select appropriate manufacturing processes and materials for industrial production and operations.`,
        `Apply thermal and fluid engineering principles to analyze power plants, refrigeration, and automotive systems.`
      ]
    },
    'CIVIL': {
      vision: `To excel in civil engineering education and research, developing skilled engineers who construct safe and sustainable infrastructures.`,
      mission: [
        `M1: To offer high-quality courses in structural, environmental, and transportation engineering.`,
        `M2: To promote site training, practical survey, and structural analysis skills.`,
        `M3: To cultivate teamwork, communication skills, and environmental responsibility.`
      ],
      psos: [
        `Plan, design, and execute construction projects including structural, geotechnical, and environmental systems.`,
        `Use modern surveying, GIS, and modeling tools to analyze civil infrastructure projects.`,
        `Apply sustainable materials and project management techniques to build resilient public infrastructure.`
      ]
    }
  };

  return map[deptId] || defaultVM;
}

function compileLabManualHtml(data) {
  let parsed;
  try {
    parsed = JSON.parse(data.content);
  } catch (e) {
    console.error("Failed to parse JSON for labmanual:", e);
    return `<p>Error: Failed to parse Lab Manual JSON data.</p>`;
  }

  const deptId = data.DEPARTMENT.split(' ')[0] || 'AI_DS';
  const deptVM = getDepartmentVM(deptId);
  const yearSem = data.YEAR && data.SEMESTER ? resolveYearSem(data.YEAR.replace(/\D/g, ''), data.SEMESTER.replace(/\D/g, '')) : resolveYearSem(1, 1);
  const displayDate = data.GENERATION_DATE;
  const collegeName = data.collegeName || 'SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY';
  const facultyName = data.facultyName || data.STAFF_NAME || 'Faculty In-charge';

  let html = '';

  // 1. Cover Page
  html += `
    <div class="page" style="page-break-after: always; text-align: center; font-family: 'Times New Roman'; padding-top: 50px;">
      <h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 5px;">${collegeName.toUpperCase()}</h1>
      <h3 style="font-size: 14pt; font-weight: normal; margin-top: 0;">(Autonomous)</h3>
      <p style="font-size: 11pt; margin-bottom: 40px;">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</p>
      
      <div style="margin: 40px 0; text-align: center;">
        <div style="width: 100px; height: 100px; border: 1px solid #ddd; margin: 0 auto; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; color: #aaa;">[ COLLEGE LOGO ]</div>
      </div>
      
      <h2 style="font-size: 16pt; font-weight: bold; margin-top: 30px; text-transform: uppercase;">DEPARTMENT OF ${data.DEPARTMENT.toUpperCase()}</h2>
      
      <div style="margin: 30px 0; text-align: center;">
        <div style="border: 2px solid #f97316; padding: 10px 20px; display: inline-block; font-weight: bold; color: #1e293b; letter-spacing: 1px; font-size: 14pt;">RECORD NOTEBOOK</div>
      </div>
      
      <h2 style="font-size: 18pt; font-weight: bold; color: #000; margin-top: 20px; text-transform: uppercase; text-decoration: underline;">${data.SUBJECT_CODE} &ndash; ${data.SUBJECT_NAME}</h2>
      <h3 style="font-size: 14pt; font-weight: bold; margin-top: 10px; text-transform: uppercase;">${data.YEAR}</h3>
      <h3 style="font-size: 12pt; font-weight: bold; margin-top: 10px;">(REGULATION-${data.REGULATION})</h3>
      
      <div style="border: 2px solid #f97316; border-radius: 12px; padding: 20px; margin-top: 60px; text-align: left; width: 85%; margin-left: auto; margin-right: auto; font-size: 11pt;">
        <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 0;">
          <tr style="border: none;"><td style="font-weight: bold; width: 40%; border: none; padding: 6px 0; font-size: 10.5pt;">NAMEOFTHESTUDENT</td><td style="border: none; padding: 6px 0; font-size: 10.5pt;">: __________________________________________</td></tr>
          <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 6px 0; font-size: 10.5pt;">REGISTERNUMBER</td><td style="border: none; padding: 6px 0; font-size: 10.5pt;">: __________________________________________</td></tr>
          <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 6px 0; font-size: 10.5pt;">YEAR/SEM</td><td style="border: none; padding: 6px 0; font-size: 10.5pt;">: __________________________________________</td></tr>
          <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 6px 0; font-size: 10.5pt;">COURSE/BRANCH</td><td style="border: none; padding: 6px 0; font-size: 10.5pt;">: __________________________________________</td></tr>
        </table>
      </div>
    </div>
  `;

  // 2. Certificate Page
  html += `
    <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 50px;">
      <h1 style="font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 5px;">${collegeName.toUpperCase()}</h1>
      <h3 style="font-size: 11pt; font-weight: normal; text-align: center; margin-top: 0; margin-bottom: 25px;">(Autonomous)</h3>
      
      <div style="margin: 20px 0; text-align: center;">
        <div style="border: 1px solid #000; padding: 5px 15px; display: inline-block; font-weight: bold; font-size: 11pt;">RECORD NOTEBOOK</div>
      </div>
      
      <p style="font-size: 12pt; font-weight: bold; text-align: left; margin-bottom: 30px;">
        REGISTERNUMBER : __________________________________
      </p>
      
      <p style="font-size: 12pt; text-align: justify; line-height: 2.0; margin-bottom: 50px;">
        Certified that this is a Bonafide record of Practical work done by Mr./Ms. __________________________________________________________________
        of the <strong>${data.SEMESTER}</strong> Semester __________________________________________________ Branch during the Academic year <strong>${data.YEAR}</strong>
        in the <strong>${data.SUBJECT_CODE} &ndash; ${data.SUBJECT_NAME}</strong> Laboratory.
      </p>
      
      <table style="width: 100%; border: none; margin-top: 100px; font-size: 11pt; margin-bottom: 0;">
        <tr>
          <td style="width: 50%; font-weight: bold; text-align: left; border: none; padding: 0;">Signature of Staff In-charge</td>
          <td style="width: 50%; font-weight: bold; text-align: right; border: none; padding: 0;">Signature of Head of Department</td>
        </tr>
      </table>
    </div>
  `;

  // 3. Vision & Mission
  html += `
    <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 20px;">
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">VISION OF THE INSTITUTE</h2>
      <p style="text-align: justify; line-height: 1.6; font-size: 11pt;">To be an institute of repute in the field of engineering and technology by implementing the best educational practices akin to global standards for fostering domain knowledge and developing research attitude among students to make them globally competent.</p>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">MISSION OF THE INSTITUTE</h2>
      <ul style="line-height: 1.6; font-size: 11pt;">
        <li>Achieving excellence in Teaching Learning process using state-of-the-art resources.</li>
        <li>Extending opportunity to upgrade faculty knowledge and skills.</li>
        <li>Implementing the best student training practices for requirements of industrial scenario of the state.</li>
        <li>Motivating faculty and students in research activity for real time application.</li>
      </ul>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 40px; text-transform: uppercase;">VISION OF THE DEPARTMENT</h2>
      <p style="text-align: justify; line-height: 1.6; font-size: 11pt;">${deptVM.vision}</p>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">MISSION OF THE DEPARTMENT</h2>
      <ul style="line-height: 1.6; font-size: 11pt;">
        ${deptVM.mission.map(m => `<li>${m}</li>`).join('')}
      </ul>
    </div>
  `;

  // 4. PEO, PO & PSO
  html += `
    <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 20px;">
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">PROGRAM EDUCATIONAL OBJECTIVES (PEOs)</h2>
      <ul style="line-height: 1.6; font-size: 11pt;">
        <li><strong>PEO 1:</strong> Graduates will be able to demonstrate their technical skills and competency in various applications by providing creative and novel technological solutions.</li>
        <li><strong>PEO 2:</strong> Graduates will be able to ensure the effective contribution to the society through critical thinking, innovations and research with the broad spectrum of skills in frontline technologies.</li>
        <li><strong>PEO 3:</strong> Graduates will be equipped with multidisciplinary initiatives and visions towards the growth of society with respect to ethical and lifelong learning.</li>
      </ul>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">PROGRAM SPECIFIC OUTCOMES (PSOs)</h2>
      <ul style="line-height: 1.6; font-size: 11pt;">
        ${deptVM.psos.map((pso, idx) => `<li><strong>PSO ${idx+1}:</strong> ${pso}</li>`).join('')}
      </ul>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">PROGRAM OUTCOMES (POs)</h2>
      <ol style="line-height: 1.4; font-size: 9.5pt; padding-left: 15px;">
        <li><strong>Engineering knowledge:</strong> Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.</li>
        <li><strong>Problem analysis:</strong> Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.</li>
        <li><strong>Design/development of solutions:</strong> Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.</li>
        <li><strong>Conduct investigations of complex problems:</strong> Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.</li>
        <li><strong>Modern tool usage:</strong> Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.</li>
        <li><strong>The engineer and society:</strong> Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.</li>
        <li><strong>Environment and sustainability:</strong> Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.</li>
        <li><strong>Ethics:</strong> Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.</li>
        <li><strong>Individual and team work:</strong> Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.</li>
        <li><strong>Communication:</strong> Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.</li>
        <li><strong>Project management and finance:</strong> Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.</li>
        <li><strong>Life-long learning:</strong> Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.</li>
      </ol>
    </div>
  `;

  // 5. Course Objectives, Outcomes & Mapping Matrix
  html += `
    <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 20px;">
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">COURSE OBJECTIVES</h2>
      <ol style="line-height: 1.6; font-size: 11pt;">
        ${(parsed.courseObjectives || []).map(obj => `<li>${obj}</li>`).join('')}
      </ol>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">COURSE OUTCOMES (COs)</h2>
      <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; font-size: 10pt; margin-top: 10px;">
        <tr style="background-color: #f2f2f2;">
          <th style="width: 15%; text-align: center;">CO No.</th>
          <th style="width: 65%; text-align: left;">Course Outcome Description</th>
          <th style="width: 20%; text-align: center;">Bloom's Level</th>
        </tr>
        ${(parsed.courseOutcomes || []).map(co => `
          <tr>
            <td style="font-weight: bold; text-align: center;">${co.co}</td>
            <td>${co.description}</td>
            <td style="text-align: center;">${co.bloomsLevel}</td>
          </tr>
        `).join('')}
      </table>
      
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 40px; text-transform: uppercase;">CO-PO / CO-PSO MAPPING MATRIX</h2>
      <table border="1" cellpadding="4" style="border-collapse: collapse; width: 100%; font-size: 9.5pt; text-align: center; margin-top: 10px;">
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td>CO</td>
          <td>PO1</td><td>PO2</td><td>PO3</td><td>PO4</td><td>PO5</td><td>PO6</td><td>PO7</td><td>PO8</td><td>PO9</td><td>PO10</td><td>PO11</td><td>PO12</td>
          <td>PSO1</td><td>PSO2</td><td>PSO3</td>
        </tr>
        ${(parsed.coPoMapping || []).map(row => `
          <tr>
            <td style="font-weight: bold;">${row.co}</td>
            <td>${row.po1 || '-'}</td><td>${row.po2 || '-'}</td><td>${row.po3 || '-'}</td><td>${row.po4 || '-'}</td><td>${row.po5 || '-'}</td><td>${row.po6 || '-'}</td><td>${row.po7 || '-'}</td><td>${row.po8 || '-'}</td><td>${row.po9 || '-'}</td><td>${row.po10 || '-'}</td><td>${row.po11 || '-'}</td><td>${row.po12 || '-'}</td>
            <td>${row.pso1 || '-'}</td><td>${row.pso2 || '-'}</td><td>${row.pso3 || '-'}</td>
          </tr>
        `).join('')}
      </table>
      <p style="font-size: 8.5pt; color: #555; margin-top: 5px;">* Mapping Scale: 3 = High Correlation, 2 = Medium Correlation, 1 = Low Correlation, '-' = No Correlation.</p>
    </div>
  `;

  // 6. List of Experiments
  html += `
    <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 20px;">
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">LIST OF EXPERIMENTS</h2>
      <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; font-size: 10pt; margin-top: 15px;">
        <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
          <th style="width: 10%;">Ex.No</th>
          <th style="width: 60%; text-align: left;">Experiment Title</th>
          <th style="width: 15%;">Mapped CO</th>
          <th style="width: 15%;">Bloom's Level</th>
        </tr>
        ${(parsed.experiments || []).map(exp => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${exp.no}</td>
            <td>${exp.title}</td>
            <td style="text-align: center;">${exp.coMapping}</td>
            <td style="text-align: center;">${exp.bloomsLevel}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;

  // 7. Table of Contents
  html += `
    <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 20px;">
      <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase; text-align: center;">TABLE OF CONTENTS</h2>
      <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; font-size: 10.5pt; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
            <th style="width: 10%;">S.No.</th>
            <th style="width: 20%;">DATE</th>
            <th style="width: 50%; text-align: left;">Name of the Experiment</th>
            <th style="width: 10%;">MARKS</th>
            <th style="width: 10%;">SIGNATURE</th>
          </tr>
        </thead>
        <tbody>
          ${(parsed.experiments || []).map(exp => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${exp.no}</td>
              <td style="text-align: center;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
              <td>${exp.title}</td>
              <td style="text-align: center;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
              <td style="text-align: center;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // 8. Detailed Experiments
  (parsed.experiments || []).forEach(exp => {
    html += `
      <div class="page" style="page-break-after: always; font-family: 'Times New Roman'; padding-top: 20px; line-height: 1.5; page-break-before: always;">
        <table style="width: 100%; border: none; font-size: 11pt; font-weight: bold; margin-bottom: 15px; margin-top: 0;">
          <tr style="border: none;">
            <td style="border: none; padding: 0;">EX. NO: ${exp.no}</td>
            <td align="right" style="border: none; padding: 0;">DATE: __________________</td>
          </tr>
        </table>
        
        <h2 style="font-size: 13pt; font-weight: bold; text-align: center; text-transform: uppercase; text-decoration: underline; margin-bottom: 25px;">${exp.title}</h2>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>AIM:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.aim}</p>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>OBJECTIVES:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.objectives || 'None'}</p>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>THEORY:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify; line-height: 1.6;">${exp.theory}</p>
        
        ${exp.apparatusRequired && exp.apparatusRequired.length > 0 ? `
          <p style="margin-top: 12px; margin-bottom: 4px;"><strong>APPARATUS / COMPONENT REQUIREMENTS:</strong></p>
          <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; font-size: 9.5pt; margin-left: 15px; margin-bottom: 12px;">
            <tr style="background-color: #f9f9f9; font-weight: bold; text-align: center;">
              <td>S.No</td>
              <td style="text-align: left;">Component/Apparatus Name</td>
              <td style="text-align: left;">Specification</td>
              <td>Qty</td>
            </tr>
            ${exp.apparatusRequired.map((item, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${item.name}</td>
                <td>${item.specification || 'N/A'}</td>
                <td style="text-align: center;">${item.quantity}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        
        <table style="width: 100%; border: none; font-size: 10.5pt; margin-left: 15px; margin-bottom: 12px; margin-top: 0;">
          <tr style="border: none;">
            <td style="width: 50%; border: none; padding: 0;"><strong>Hardware Required:</strong> ${exp.hardwareRequired || 'None'}</td>
            <td style="width: 50%; border: none; padding: 0;"><strong>Software Required:</strong> ${exp.softwareRequired || 'None'}</td>
          </tr>
        </table>
        
        ${exp.algorithm ? `
          <p style="margin-top: 12px; margin-bottom: 4px;"><strong>ALGORITHM:</strong></p>
          <pre style="margin-left: 15px; margin-bottom: 12px; font-family: 'Times New Roman'; font-size: 11pt; white-space: pre-wrap; text-align: justify; border: none; background: transparent; padding: 0;">${exp.algorithm}</pre>
        ` : ''}
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>PROCEDURE:</strong></p>
        <ol style="margin-left: 15px; margin-bottom: 12px; padding-left: 15px;">
          ${(exp.procedure || []).map(step => `<li style="margin-bottom: 4px; text-align: justify;">${step}</li>`).join('')}
        </ol>
        
        ${(exp.program1 || exp.program) ? `
          <p style="margin-top: 12px; margin-bottom: 4px;"><strong>${exp.program1 ? 'PROGRAM 1:' : 'PROGRAM / CONFIGURATION:'}</strong></p>
          <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 10px; margin-left: 15px; margin-bottom: 12px;">
            <pre style="font-family: Consolas, monospace; font-size: 9pt; white-space: pre-wrap; margin: 0; border: none; background: transparent; padding: 0;">${exp.program1 || exp.program}</pre>
          </div>
        ` : ''}
        
        ${exp.program2 ? `
          <p style="margin-top: 12px; margin-bottom: 4px;"><strong>PROGRAM 2:</strong></p>
          <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 10px; margin-left: 15px; margin-bottom: 12px;">
            <pre style="font-family: Consolas, monospace; font-size: 9pt; white-space: pre-wrap; margin: 0; border: none; background: transparent; padding: 0;">${exp.program2}</pre>
          </div>
        ` : ''}
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>OBSERVATIONS / TABULATION:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.observations || 'N/A'}</p>
        
        <table style="width: 100%; border: none; font-size: 10.5pt; margin-left: 15px; margin-bottom: 12px; margin-top: 0;">
          <tr style="border: none;">
            <td style="width: 50%; vertical-align: top; border: none; padding: 0;"><strong>Sample Input:</strong><br/>${exp.sampleInput || 'N/A'}</td>
            <td style="width: 50%; vertical-align: top; border: none; padding: 0;"><strong>Sample Output:</strong><br/>${exp.sampleOutput || 'N/A'}</td>
          </tr>
        </table>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>RESULT:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; font-weight: bold; color: #15803d; text-align: justify;">${exp.result}</p>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>APPLICATIONS:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.applications || 'None'}</p>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>PRECAUTIONS:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.precautions || 'None'}</p>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>LEARNING OUTCOME:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.learningOutcome || 'None'}</p>
        
        <p style="margin-top: 12px; margin-bottom: 4px;"><strong>REFERENCES:</strong></p>
        <p style="margin-left: 15px; margin-bottom: 20px; text-align: justify;">${exp.references || 'None'}</p>
        
        <div style="page-break-before: always; padding-top: 10px; page-break-inside: avoid;">
          <p style="font-weight: bold; text-decoration: underline; margin-bottom: 10px;">VIVA VOCE QUESTIONS (10):</p>
          <ol style="padding-left: 20px; font-size: 10pt; line-height: 1.5;">
            ${(exp.vivaQuestions || []).map(q => `
              <li style="margin-bottom: 8px;">
                <strong>Q: ${q.question}</strong><br/>
                <span style="color: #444;">A: ${q.answer}</span>
              </li>
            `).join('')}
          </ol>
        </div>
      </div>
    `;
  });

  // 9. Final Signature Page
  html += `
    <div class="page" style="font-family: 'Times New Roman'; padding-top: 50px; page-break-before: always;">
      <h2 style="text-align: center; font-size: 16pt; font-weight: bold; text-decoration: underline; margin-bottom: 100px;">LAB COMPLETION SIGN-OFF</h2>
      
      <p style="font-size: 12pt; text-align: justify; line-height: 1.8; margin-bottom: 150px;">
        Certified that the student has successfully completed all the practical exercises prescribed in the syllabus 
        for the course <strong>${data.SUBJECT_CODE} - ${data.SUBJECT_NAME}</strong>.
      </p>
      
      <table style="width: 100%; border: none; font-size: 11pt; font-weight: bold; margin-bottom: 0;">
        <tr>
          <td style="width: 33%; text-align: left; border: none; padding: 0;">FACULTY IN-CHARGE</td>
          <td style="width: 34%; text-align: center; border: none; padding: 0;">LAB IN-CHARGE</td>
          <td style="width: 33%; text-align: right; border: none; padding: 0;">HEAD OF DEPARTMENT</td>
        </tr>
      </table>
    </div>
  `;

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${data.SUBJECT_CODE} Lab Manual</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.4; }
          .page { page-break-after: always; clear: both; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; font-size: 10pt; }
          th { background-color: #f2f2f2; font-weight: bold; }
          pre { font-family: Consolas, monospace; font-size: 9pt; border: 1px solid #ccc; padding: 8px; background-color: #fafafa; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

function compileSessionPlanHtml(data) {
  let parsed = null;
  try {
    parsed = JSON.parse(data.content);
  } catch (e) {
    return `
      <html>
        <body>
          <h2>Session Plan</h2>
          <p>No valid session plan data found.</p>
        </body>
      </html>
    `;
  }

  const { totalPeriods, workingWeeks, classesPerWeek, sessions, academicYear, classDuration } = parsed;

  // Use the top-level data fields which come from the export request (more reliable)
  const subjectCode = data.SUBJECT_CODE || parsed.subjectCode || '';
  const subjectName = data.SUBJECT_NAME || parsed.subjectName || '';
  const dept = data.DEPARTMENT || parsed.department || '';
  const reg = data.REGULATION || parsed.regulation || '';
  const sem = data.SEMESTER || `Sem ${parsed.semester || ''}`;

  let rows = '';
  sessions.forEach((s, idx) => {
    rows += `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 4px; color: #666; font-size: 9pt;">${idx + 1}</td>
        <td style="border: 1px solid #000; text-align: center; font-weight: bold; padding: 4px;">${s.period}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 600;">U${s.unit}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: left;">${s.topic}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: left; font-size: 9pt;">${s.learningOutcome || '-'}</td>
        <td style="border: 1px solid #000; text-align: center; font-weight: bold; padding: 4px;">${s.co}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 4px; font-size: 9pt;">${s.blooms || '-'}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: left; font-size: 9pt;">${s.method}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: left; font-size: 8.5pt; color: #555;">${s.ref || ''}</td>
      </tr>
    `;
  });

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Session Work Plan</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 29.7cm 21.0cm; /* A4 Landscape */
            margin: 0.6in 0.5in 0.6in 0.5in;
            mso-header-margin: 0.3in;
            mso-footer-margin: 0.3in;
            mso-page-orientation: landscape;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #000000;
          }
          .title {
            font-size: 15pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2px;
          }
          .subtitle {
            font-size: 10pt;
            text-align: center;
            color: #444;
            margin-bottom: 12px;
          }
          .doc-type {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            text-decoration: underline;
            margin-top: 10px;
            margin-bottom: 16px;
            color: #1e3a8a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Times New Roman', serif;
            font-size: 9pt;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #000000;
            padding: 4px;
          }
          th {
            background-color: #d6dce4;
            font-weight: bold;
            text-align: center;
            font-size: 9pt;
          }
          .meta-label {
            font-weight: bold;
            background-color: #f2f4f7;
            width: 16%;
            padding: 5px 8px;
          }
          .meta-val {
            padding: 5px 8px;
          }
          .total-row td {
            background-color: #e8f5e9;
          }
        </style>
      </head>
      <body>
        <div class="title">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
        <div class="subtitle">(An Autonomous Institution, Salem &ndash; 637304)</div>
        <div class="doc-type">SESSION WORK PLAN</div>

        <table style="margin-bottom: 16px; font-size: 10pt;">
          <tr>
            <td class="meta-label">Course Code &amp; Name</td>
            <td class="meta-val" style="font-weight:bold;">${subjectCode} &ndash; ${subjectName}</td>
            <td class="meta-label">Regulation</td>
            <td class="meta-val">${reg}</td>
          </tr>
          <tr>
            <td class="meta-label">Academic Year</td>
            <td class="meta-val">${academicYear || 'N/A'}</td>
            <td class="meta-label">Semester</td>
            <td class="meta-val">${sem}</td>
          </tr>
          <tr>
            <td class="meta-label">Department</td>
            <td class="meta-val">${dept}</td>
            <td class="meta-label">Class Duration</td>
            <td class="meta-val">${classDuration || '1 Hour'}</td>
          </tr>
          <tr>
            <td class="meta-label">Working Weeks</td>
            <td class="meta-val">${workingWeeks} weeks</td>
            <td class="meta-label">Classes / Week</td>
            <td class="meta-val">${classesPerWeek}</td>
          </tr>
          <tr class="total-row">
            <td class="meta-label" style="background-color: #e8f5e9;">Total Teaching Periods</td>
            <td class="meta-val" colspan="3" style="font-weight:bold; font-size:11pt; color:#047857;">${totalPeriods} Periods (${workingWeeks} weeks &times; ${classesPerWeek} classes/week)</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">S.No</th>
              <th style="width: 5%;">Period</th>
              <th style="width: 5%;">Unit</th>
              <th style="width: 24%;">Topic</th>
              <th style="width: 20%;">Learning Outcome</th>
              <th style="width: 6%;">CO</th>
              <th style="width: 10%;">Bloom's Level</th>
              <th style="width: 14%;">Teaching Method</th>
              <th style="width: 8%;">Reference</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <br/><br/>
        <table style="width:100%; border:none; margin-top:30px;">
          <tr style="border:none;">
            <td style="border:none; text-align:center; font-weight:bold; width:50%;"><div style="border-top:1px solid #000; display:inline-block; min-width:220px; padding-top:5px; margin-top:40px;">Prepared By: Faculty In-charge</div></td>
            <td style="border:none; text-align:center; font-weight:bold; width:50%;"><div style="border-top:1px solid #000; display:inline-block; min-width:220px; padding-top:5px; margin-top:40px;">Approved By: Head of Department</div></td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function compileHtmlWordFallback(data) {
  if (data.RAW_TYPE === 'labmanual') {
    return compileLabManualHtml(data);
  }
  if (data.RAW_TYPE === 'sessionplan') {
    return compileSessionPlanHtml(data);
  }

  let formattedContent = '';
  let isJsonLab = false;

  if (data.content && data.content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(data.content);
      if (parsed.experiments || parsed.courseObjectives) {
        isJsonLab = true;

        // Course Objectives
        if (parsed.courseObjectives && parsed.courseObjectives.length > 0) {
          formattedContent += '<h2 style="color:#4f46e5; margin-top:25px; font-size:14pt; font-family:\'Times New Roman\';">COURSE OBJECTIVES</h2>';
          formattedContent += '<ol>';
          parsed.courseObjectives.forEach(obj => {
            formattedContent += `<li style="margin-left: 20px; margin-bottom: 5px; font-family:\'Times New Roman\';">${obj}</li>`;
          });
          formattedContent += '</ol>';
        }

        // Course Outcomes
        if (parsed.courseOutcomes && parsed.courseOutcomes.length > 0) {
          formattedContent += '<h2 style="color:#4f46e5; margin-top:25px; font-size:14pt; font-family:\'Times New Roman\';">COURSE OUTCOMES</h2>';
          formattedContent += '<table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; font-family:\'Times New Roman\'; font-size: 10pt; margin-bottom: 20px;">';
          formattedContent += '<tr style="background-color: #f2f2f2;"><th>CO</th><th>Description</th><th>Bloom\'s Level</th></tr>';
          parsed.courseOutcomes.forEach(co => {
            formattedContent += `<tr><td style="font-weight:bold;">${co.co}</td><td>${co.description}</td><td>${co.bloomsLevel}</td></tr>`;
          });
          formattedContent += '</table>';
        }

        // Experiments
        if (parsed.experiments && parsed.experiments.length > 0) {
          formattedContent += '<h2 style="color:#4f46e5; margin-top:25px; font-size:14pt; font-family:\'Times New Roman\';">LIST OF EXPERIMENTS</h2>';
          parsed.experiments.forEach(exp => {
            formattedContent += `<div style="page-break-before: always; margin-bottom: 30px; border-bottom: 1px dashed #ccc; padding-bottom: 20px;">`;
            formattedContent += `<h3 style="color:#10b981; font-size:12pt; font-family:\'Times New Roman\'; margin-top: 15px;">EX. NO: ${exp.no} - ${exp.title}</h3>`;
            formattedContent += `<p style="margin-bottom: 5px; font-family:\'Times New Roman\';"><strong>Aim:</strong> ${exp.aim}</p>`;

            if (exp.apparatusRequired && exp.apparatusRequired.length > 0) {
              formattedContent += `<p style="margin-bottom: 5px; font-family:\'Times New Roman\';"><strong>Apparatus Required:</strong></p>`;
              formattedContent += '<table border="1" cellpadding="4" style="border-collapse: collapse; width: 100%; font-family:\'Times New Roman\'; font-size: 9pt; margin-bottom: 10px;">';
              formattedContent += '<tr style="background-color: #f9f9f9;"><th>S.No</th><th>Item Name</th><th>Specification</th><th>Quantity</th></tr>';
              exp.apparatusRequired.forEach((item, idx) => {
                formattedContent += `<tr><td>${idx + 1}</td><td>${item.name}</td><td>${item.specification}</td><td>${item.quantity}</td></tr>`;
              });
              formattedContent += '</table>';
            }

            formattedContent += `<p style="margin-bottom: 5px; font-family:\'Times New Roman\';"><strong>Theory:</strong></p>`;
            formattedContent += `<p style="text-align: justify; text-justify: inter-word; font-family:\'Times New Roman\'; margin-bottom: 10px;">${exp.theory}</p>`;

            if (exp.procedure && exp.procedure.length > 0) {
              formattedContent += `<p style="margin-bottom: 5px; font-family:\'Times New Roman\';"><strong>Procedure:</strong></p>`;
              formattedContent += '<ol>';
              exp.procedure.forEach(step => {
                formattedContent += `<li style="margin-left: 20px; margin-bottom: 3px; font-family:\'Times New Roman\';">${step}</li>`;
              });
              formattedContent += '</ol>';
            }

            formattedContent += `<p style="margin-bottom: 5px; font-family:\'Times New Roman\';"><strong>Sample Output / Observation:</strong></p>`;
            formattedContent += `<pre style="background-color:#f8fafc; border:1px solid #e2e8f0; padding:10px; font-family:Consolas, monospace; font-size:9pt; margin-bottom: 10px; white-space: pre-wrap;">${exp.sampleOutput}</pre>`;

            formattedContent += `<p style="background-color:#f0fdf4; border:1px solid #bbf7d0; padding:8px; font-family:\'Times New Roman\'; color:#15803d;"><strong>Result:</strong> ${exp.result}</p>`;
            formattedContent += `</div>`;
          });
        }
      }
    } catch (e) {
      console.warn("Could not parse payload content as JSON for labmanual Word export:", e);
    }
  }

  if (!isJsonLab) {
    formattedContent = data.content
      .replace(/^### (.*$)/gim, '<h3 style="color:#4f46e5; margin-top:20px; font-size:14pt; font-family:\'Times New Roman\';">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#4f46e5; margin-top:25px; font-size:16pt; font-family:\'Times New Roman\';">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#4f46e5; margin-top:30px; font-size:18pt; font-family:\'Times New Roman\';">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 5px; font-family:\'Times New Roman\';">$1</li>')
      // Format MCQ Options (lines starting with option indicators)
      .replace(/^\s*([a-d][\)\.])\s*(.*)$/gim, '<div style="margin-left: 20px; color: #334155; margin-bottom: 3px; font-family:\'Times New Roman\';">$1 $2</div>')
      // Format Correct answer lines
      .replace(/^\s*(Correct\s*:\s*.*)$/gim, '<div style="margin-left: 20px; margin-bottom: 12px; color: #15803d; font-weight: bold; font-family:\'Times New Roman\';">$1</div>')
      // Format Questions lines (lines starting with Q1., Q2., or 1., 2.)
      .replace(/^\s*(Q?\d+[\.\)]\s*.*)$/gim, '<div style="font-weight: bold; margin-top: 15px; margin-bottom: 6px; font-family:\'Times New Roman\';">$1</div>')
      .replace(/\n/gim, '<br />');
  }

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${data.SUBJECT_CODE} Assessment</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 11pt; 
            color: #1e293b;
            line-height: 1.5; 
          }
          .header-table { 
            width: 100%; 
            border-bottom: 2px solid #4f46e5; 
            margin-bottom: 30px; 
            padding-bottom: 10px; 
          }
          .college-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1e293b;
            text-align: center;
            text-transform: uppercase;
          }
          .dept-title {
            font-size: 12pt;
            font-weight: bold;
            color: #4f46e5;
            text-align: center;
            text-transform: uppercase;
            margin-top: 5px;
          }
          .meta-table {
            width: 100%;
            margin-top: 15px;
            font-size: 10pt;
            color: #4f5e71;
            border-collapse: collapse;
          }
          .meta-table td {
            padding: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="college-title">Sri Shanmugha College of Engineering and Technology</div>
        <div class="dept-title">Department of ${data.DEPARTMENT}</div>
        
        <table class="meta-table">
          <tr>
            <td><strong>Subject:</strong> ${data.SUBJECT_CODE} - ${data.SUBJECT_NAME}</td>
            <td align="right"><strong>Staff In-Charge:</strong> ${data.STAFF_NAME}</td>
          </tr>
          <tr>
            <td><strong>Regulation:</strong> ${data.REGULATION} | <strong>Semester:</strong> Sem ${data.SEMESTER}</td>
            <td align="right"><strong>Date:</strong> ${data.GENERATION_DATE}</td>
          </tr>
          <tr>
            <td><strong>Assessment Type:</strong> ${data.DOCUMENT_TYPE}</td>
            <td align="right"><strong>Academic Year:</strong> ${data.YEAR}</td>
          </tr>
        </table>
        
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
        
        <div class="content-area">
          ${formattedContent}
        </div>
      </body>
    </html>
  `;
}

// =====================================================================
// CORE DOCUMENT GENERATOR
// =====================================================================

/**
 * Core generation service merging content, database values, and templates
 * @param {object} payload - The generation details
 * @returns {object} - { buffer: Buffer, filename: string, isFallback: boolean }
 */
function generateDocument(payload) {
  try {
    const { 
      subjectCode, 
      subjectName, 
      departmentId, 
      departmentName, 
      semester, 
      regulation, 
      year, 
      type, 
      content,
      collegeName,
      facultyName
    } = payload;

    if (!subjectCode || !content) {
      throw new Error('Subject code and content are required for document compilation.');
    }

    // 1. Resolve staff dynamically
    const staffName = subjectStaffService.resolveStaff(subjectCode);

    // 2. Format names and parameters
    const displayDept = departmentName || (departmentId ? `${departmentId} Engineering` : 'Academic Department');
    const displayDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const docTypeLabel = {
      cia1: 'Continuous Internal Assessment 1 (CIA 1)',
      cia2: 'Continuous Internal Assessment 2 (CIA 2)',
      qbank: 'Academic Question Bank',
      quiz: 'Classroom Quiz',
      hots: 'Higher Order Thinking Skills (HOTS)',
      assignment: 'Practical Assignment',
      beyond: 'Beyond Syllabus Content',
      labmanual: 'Laboratory Manual',
      coursefile: 'Course File Outline',
      syllabus: 'Subject Syllabus'
    }[type] || type.toUpperCase();

    const docName = `${subjectCode}_${type.toUpperCase()}_Formatted`;

    // 3. Check if this is a CIA type that uses the official template with question parsing
    const isCIA = (type === 'cia1' || type === 'cia2');

    if (isCIA) {
      // CIA-specific: parse questions and fill the official template
      console.log(`Generating CIA document with official template for type ${type}...`);

      // Step 5 Log: Raw AI output
      console.log("RAW OUTPUT:\n", content);

      // Extract sections manually for logging to trace segmentation issues
      const partAIdx = content.search(/Part\s*A/i);
      const partBIdx = content.search(/Part\s*B/i);
      const partCIdx = content.search(/Part\s*C/i);
      let partATextLog = '';
      let partBTextLog = '';
      if (partAIdx !== -1) {
        if (partBIdx !== -1) {
          partATextLog = content.substring(partAIdx, partBIdx);
          partBTextLog = (partCIdx !== -1) ? content.substring(partBIdx, partCIdx) : content.substring(partBIdx);
        } else {
          partATextLog = content.substring(partAIdx);
        }
      } else {
        partATextLog = content;
        partBTextLog = content;
      }
      console.log("PART A SECTION TEXT:\n", partATextLog);
      console.log("PART B SECTION TEXT:\n", partBTextLog);

      // Parse individual questions from AI output
      const parsedQuestions = parseQuestions(content);
      
      // Debug logging for CIA export pipeline tracing
      const partAKeys = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10'];
      const partBKeys = ['Q11a','Q11b','Q12a','Q12b','Q13a','Q13b'];
      const filledA = partAKeys.filter(k => parsedQuestions[k] && parsedQuestions[k].trim());
      const filledB = partBKeys.filter(k => parsedQuestions[k] && parsedQuestions[k].trim());
      const emptyB = partBKeys.filter(k => !parsedQuestions[k] || !parsedQuestions[k].trim());
      
      console.log(`[CIA Export] Parsed: Part A = ${filledA.length}/10, Part B = ${filledB.length}/6`);
      if (emptyB.length > 0) {
        console.warn(`[CIA Export] ⚠ Empty Part B fields: ${emptyB.join(', ')}`);
      }
      partBKeys.forEach(k => {
        const val = parsedQuestions[k];
        console.log(`  ${k}: ${val ? `"${val.substring(0, 80)}${val.length > 80 ? '...' : ''}"` : '(empty)'}`);
      });

      // Build the full placeholder map for docxtemplater (including lowercase fallbacks for absolute template safety)
      const placeholders = {
        // Metadata fields
        YEAR_SEM: resolveYearSem(year, semester),
        ACADEMIC_YEAR: resolveAcademicYear(),
        BRANCH: resolveBranch(departmentId, departmentName),
        DURATION: '100 minutes',
        MAX_MARKS: '60',
        REGULATION: resolveRegulation(regulation),
        SUBJECT_CODE: subjectCode,
        SUBJECT_NAME: subjectName || 'Academic Subject',

        // Course outcomes (placeholder descriptions — can be customized per subject)
        CO3_DESC: 'Understand and apply the fundamental concepts of the subject.',
        CO4_DESC: 'Analyze and evaluate complex problems using subject knowledge.',
        CO5_DESC: 'Design and create solutions applying higher-order thinking skills.',

        // Part A questions (Q1 to Q10 - supporting both case styles)
        Q1: parsedQuestions.Q1 || '', q1: parsedQuestions.Q1 || '',
        Q2: parsedQuestions.Q2 || '', q2: parsedQuestions.Q2 || '',
        Q3: parsedQuestions.Q3 || '', q3: parsedQuestions.Q3 || '',
        Q4: parsedQuestions.Q4 || '', q4: parsedQuestions.Q4 || '',
        Q5: parsedQuestions.Q5 || '', q5: parsedQuestions.Q5 || '',
        Q6: parsedQuestions.Q6 || '', q6: parsedQuestions.Q6 || '',
        Q7: parsedQuestions.Q7 || '', q7: parsedQuestions.Q7 || '',
        Q8: parsedQuestions.Q8 || '', q8: parsedQuestions.Q8 || '',
        Q9: parsedQuestions.Q9 || '', q9: parsedQuestions.Q9 || '',
        Q10: parsedQuestions.Q10 || '', q10: parsedQuestions.Q10 || '',

        // Part B questions (Q11a to Q13b - supporting both case styles)
        Q11a: parsedQuestions.Q11a || '', q11a: parsedQuestions.Q11a || '',
        Q11b: parsedQuestions.Q11b || '', q11b: parsedQuestions.Q11b || '',
        Q12a: parsedQuestions.Q12a || '', q12a: parsedQuestions.Q12a || '',
        Q12b: parsedQuestions.Q12b || '', q12b: parsedQuestions.Q12b || '',
        Q13a: parsedQuestions.Q13a || '', q13a: parsedQuestions.Q13a || '',
        Q13b: parsedQuestions.Q13b || '', q13b: parsedQuestions.Q13b || '',
      };

      // Load the official template
      const templateBuffer = templateService.getTemplateBuffer(type);
      if (templateBuffer) {
        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Step 2 Log: complete object being passed to docxtemplater
        console.log("TEMPLATE DATA PASSED TO DOCXTEMPLATER:");
        console.log(JSON.stringify(placeholders, null, 2));

        doc.render(placeholders);

        const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
        console.log(`Successfully generated CIA document: ${docName}.docx`);
        
        return {
          buffer: outputBuffer,
          filename: `${docName}.docx`,
          isFallback: false
        };
      }

      // If template file not found, fall through to HTML fallback
      console.warn('CIA template not found, falling back to HTML Word document...');
    }

    // 4. Non-CIA types or fallback: Try generic template-based rendering
    const hasDocxTemplate = templateService.hasTemplate(type);
    if (hasDocxTemplate && !isCIA) {
      const isQBankType = (type === 'qbank' || type === 'quiz' || type === 'assignment');
      
      if (isQBankType || type === 'beyond' || type === 'hots' || type === 'labmanual') {
        try {
          const fs = require('fs');
          const path = require('path');
          const { execFileSync } = require('child_process');
          
          const templatePath = path.resolve(templateService.getTemplatePath(type));
          let scriptName = 'qbankGenerator.py';
          if (type === 'beyond') {
            scriptName = 'beyondGenerator.py';
          } else if (type === 'hots') {
            scriptName = 'hotsGenerator.py';
          } else if (type === 'assignment') {
            scriptName = 'assignmentGenerator.py';
          } else if (type === 'labmanual') {
            scriptName = 'labManualGenerator.py';
          }
          const scriptPath = path.resolve(path.join(__dirname, scriptName));
          
          console.log(`Using high-fidelity Python generator for type ${type} using script ${scriptName}...`);
          
          const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const inputJsonPath = path.resolve(path.join(__dirname, '..', 'data', `qbank_in_${uniqueId}.json`));
          const outputDocxPath = path.resolve(path.join(__dirname, '..', 'data', `qbank_out_${uniqueId}.docx`));
          
          const payloadData = {
            subjectCode,
            subjectName,
            staffName: facultyName || staffName,
            departmentName: departmentName || displayDept,
            year: year || 'N/A',
            semester,
            regulation,
            collegeName: collegeName || 'SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY',
            facultyName: facultyName || staffName,
            content
          };
          
          fs.writeFileSync(inputJsonPath, JSON.stringify(payloadData, null, 2), 'utf8');
          
          console.log(`Running Python script: python "${scriptPath}" "${templatePath}" "${inputJsonPath}" "${outputDocxPath}"`);
          execFileSync('python', [scriptPath, templatePath, inputJsonPath, outputDocxPath]);
          
          if (fs.existsSync(outputDocxPath)) {
            const outputBuffer = fs.readFileSync(outputDocxPath);
            // clean up output file
            try { fs.unlinkSync(outputDocxPath); } catch (e) {}
            
            console.log(`Successfully generated dynamic high-fidelity DOCX via Python: ${docName}.docx`);
            return {
              buffer: outputBuffer,
              filename: `${docName}.docx`,
              isFallback: false
            };
          } else {
            console.warn("Python execution finished but output file not found. Falling back to Docxtemplater...");
          }
        } catch (pyErr) {
          console.error(`High-fidelity Python generation failed for type ${type}. Error:`, pyErr.message);
          console.log("Falling back to standard Docxtemplater rendering...");
        }
      }

      console.log(`Loading generic DOCX template for type ${type}...`);
      const templateBuffer = templateService.getTemplateBuffer(type);
      
      if (templateBuffer) {
        const placeholders = {
          SUBJECT_CODE: subjectCode,
          SUBJECT_NAME: subjectName || 'Academic Subject',
          STAFF_NAME: staffName,
          DEPARTMENT: displayDept,
          REGULATION: regulation || 'N/A',
          YEAR: year ? `Year ${year}` : 'N/A',
          SEMESTER: semester ? `Sem ${semester}` : 'N/A',
          GENERATION_DATE: displayDate,
          DOCUMENT_TYPE: docTypeLabel,
          CONTENT: formatMarkdownForDocx(content)
        };

        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(placeholders);

        const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
        console.log(`Successfully generated DOCX: ${docName}.docx`);
        return {
          buffer: outputBuffer,
          filename: `${docName}.docx`,
          isFallback: false
        };
      }
    }

    // 5. HTML Word fallback
    console.log(`Executing HTML-Word fallback for type ${type}...`);
    const fallbackPlaceholders = {
      SUBJECT_CODE: subjectCode,
      SUBJECT_NAME: subjectName || 'Academic Subject',
      STAFF_NAME: staffName,
      DEPARTMENT: displayDept,
      REGULATION: regulation || 'N/A',
      YEAR: year ? `Year ${year}` : 'N/A',
      SEMESTER: semester ? `Sem ${semester}` : 'N/A',
      GENERATION_DATE: displayDate,
      DOCUMENT_TYPE: docTypeLabel,
      RAW_TYPE: type,
      content: type === 'labmanual' ? content : cleanAllTextOfCOK(content)
    };
    const htmlFallback = compileHtmlWordFallback(fallbackPlaceholders);
    const outputBuffer = Buffer.from(htmlFallback, 'utf8');

    return {
      buffer: outputBuffer,
      filename: `${docName}.doc`,
      isFallback: true
    };

  } catch (error) {
    console.error('Error generating template-driven document:', error);
    throw error;
  }
}

module.exports = {
  generateDocument,
  parseQuestions  // exported for testing
};
