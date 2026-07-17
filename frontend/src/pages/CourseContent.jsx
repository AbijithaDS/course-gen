import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Settings, Sparkles, Download, Edit3, Save, RefreshCw, FileText, ArrowLeft, LogOut, Copy, Check, ExternalLink, FileCode, Upload, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config';



const DEPT_VM_MAP = {
  'AI_DS': {
    vision: "Envision to have Global recognition by producing high quality, creative and ethical engineers and technologists to contribute effectively through innovations and research excellence in the advancing field of Artificial Intelligence and Data Science.",
    mission: [
      "M1: To empower the cognitive skills of the students in the pioneering domain of Artificial Intelligence and Data Science by providing content based learning with quality teaching and learning opportunities, industry institute interaction activities and centers of excellence.",
      "M2: To transform professionals into technically competent to contribute to the society positively by inducing entrepreneurship skills through collaborative teaching, innovations and research.",
      "M3: To forge partnerships with companies to tackle real-world challenges using AI solutions, facilitating research projects and internships to bridge academia and industry."
    ],
    psos: [
      "Ability to identify, design and apply domain knowledge and computational skills to evolve novel intelligent solutions for Artificial Intelligence and Data Science related processes in our ecosystem.",
      "Ability to critique the role of Artificial Intelligence and Data Science in multi-disciplinary areas to transform thoughts into products through research and innovative career.",
      "Ability to Apply adaptive machine learning algorithms, statistical models, tools and techniques to develop intelligent systems for solving problems from inter-disciplinary domains."
    ]
  },
  'AIDS': {
    vision: "Envision to have Global recognition by producing high quality, creative and ethical engineers and technologists to contribute effectively through innovations and research excellence in the advancing field of Artificial Intelligence and Data Science.",
    mission: [
      "M1: To empower the cognitive skills of the students in the pioneering domain of Artificial Intelligence and Data Science by providing content based learning with quality teaching and learning opportunities, industry institute interaction activities and centers of excellence.",
      "M2: To transform professionals into technically competent to contribute to the society positively by inducing entrepreneurship skills through collaborative teaching, innovations and research.",
      "M3: To forge partnerships with companies to tackle real-world challenges using AI solutions, facilitating research projects and internships to bridge academia and industry."
    ],
    psos: [
      "Ability to identify, design and apply domain knowledge and computational skills to evolve novel intelligent solutions for Artificial Intelligence and Data Science related processes in our ecosystem.",
      "Ability to critique the role of Artificial Intelligence and Data Science in multi-disciplinary areas to transform thoughts into products through research and innovative career.",
      "Ability to Apply adaptive machine learning algorithms, statistical models, tools and techniques to develop intelligent systems for solving problems from inter-disciplinary domains."
    ]
  },
  'CSE': {
    vision: "To produce highly competent and ethical computer science professionals through quality education, research, and innovation to meet global challenges.",
    mission: [
      "M1: To provide state-of-the-art facilities and a learning environment for quality education.",
      "M2: To foster research, innovation, and entrepreneurship skills in computer science.",
      "M3: To cultivate professional ethics, team spirit, and social responsibility."
    ],
    psos: [
      "Apply software engineering principles and practices to develop quality software applications for complex real-world problems.",
      "Utilize modern tools and platforms including cloud computing and data analytics to design and deploy computer-based systems.",
      "Adopt secure coding standards and computational practices to build robust IT infrastructure and systems."
    ]
  },
  'IT': {
    vision: "To be a center of excellence in Information Technology, producing skilled professionals who can innovate and adapt to the dynamic technological landscape.",
    mission: [
      "M1: To impart comprehensive knowledge in theoretical and applied Information Technology.",
      "M2: To bridge the academic-industry gap through training, internships, and collaborative projects.",
      "M3: To nurture research capabilities, ethical values, and lifelong learning attitudes.",
      "M4: To forge relationships with companies to tackle real-world challenges using IT solutions."
    ],
    psos: [
      "Design and develop efficient web and mobile applications using modern programming frameworks and database technologies.",
      "Configure, secure, and manage computer network systems and cloud environments for diverse enterprise needs.",
      "Analyze data and integrate intelligent algorithms to solve problems in information retrieval and processing."
    ]
  },
  'ECE': {
    vision: "To achieve global standards in Electronics and Communication Engineering education and research, creating competent professionals for industrial and societal needs.",
    mission: [
      "M1: To provide high-quality academic programs in electronics, communication, and allied domains.",
      "M2: To encourage research, design innovation, and technical skill development.",
      "M3: To instill professional ethics, leadership qualities, and social awareness."
    ],
    psos: [
      "Design and test electronic circuits, embedded systems, and VLSI modules for telecommunication and industrial systems.",
      "Apply signal processing and communication techniques to solve engineering problems in wireless and network industries.",
      "Use software design tools and platforms to model, simulate, and analyze electronic systems."
    ]
  },
  'EEE': {
    vision: "To be a premier department for education and research in Electrical and Electronics Engineering, nurturing ethical leaders and innovators.",
    mission: [
      "M1: To provide a strong foundation in electrical machines, power systems, and control systems.",
      "M2: To promote research, hands-on training, and industry-collaborative projects.",
      "M3: To inculcate engineering ethics, teamwork, and commitment to sustainable environment."
    ],
    psos: [
      "Analyze, design, and operate power systems, electrical machines, and control modules for sustainable energy.",
      "Design power electronic converters and motor drives for industrial automation and electric vehicles.",
      "Use microcontrollers and modern instrumentation tools to develop smart grid and automation solutions."
    ]
  },
  'MECH': {
    vision: "To produce globally competent and ethical mechanical engineers through quality education, research, and collaborative practices.",
    mission: [
      "M1: To impart knowledge in design, manufacturing, and thermal engineering.",
      "M2: To encourage industry visits, practical projects, and research activities.",
      "M3: To foster professional leadership, business ethics, and lifelong learning."
    ],
    psos: [
      "Design mechanical systems and components using CAD/CAM tools and finite element analysis methods.",
      "Select appropriate manufacturing processes and materials for industrial production and operations.",
      "Apply thermal and fluid engineering principles to analyze power plants, refrigeration, and automotive systems."
    ]
  },
  'CIVIL': {
    vision: "To excel in civil engineering education and research, developing skilled engineers who construct safe and sustainable infrastructures.",
    mission: [
      "M1: To offer high-quality courses in structural, environmental, and transportation engineering.",
      "M2: To promote site training, practical survey, and structural analysis skills.",
      "M3: To cultivate teamwork, communication skills, and environmental responsibility."
    ],
    psos: [
      "Plan, design, and execute construction projects including structural, geotechnical, and environmental systems.",
      "Use modern surveying, GIS, and modeling tools to analyze civil infrastructure projects.",
      "Apply sustainable materials and project management techniques to build resilient public infrastructure."
    ]
  }
};

const getDeptVM = (deptId) => {
  if (!deptId) return DEPT_VM_MAP['AI_DS'];
  const cleanId = deptId.replace(/\s+/g, '').toUpperCase();
  for (const key of Object.keys(DEPT_VM_MAP)) {
    if (cleanId.includes(key) || key.includes(cleanId)) {
      return DEPT_VM_MAP[key];
    }
  }
  return {
    vision: "To produce highly competent, ethical, and socially responsible engineers through quality education and research in the field of engineering.",
    mission: [
      "To provide state-of-the-art facilities and a modern learning environment.",
      "To bridge the gap between academia and industry through practical exposure and projects.",
      "To foster innovative thinking, research aptitude, and lifelong learning."
    ],
    psos: [
      "Apply discipline-specific engineering knowledge to solve complex technical problems.",
      "Utilize modern engineering tools and software to design and analyze systems.",
      "Develop solutions that are economically, environmentally, and ethically sustainable."
    ]
  };
};

const GENERATOR_CARDS = {
  cia1: {
    title: 'CIA 1',
    description: "Generate CIA 1 internal assessment paper based on subject syllabus and Bloom's Taxonomy.",
    buttonText: 'Generate CIA 1',
    color: '#4f46e5',
    bgLight: 'rgba(79, 70, 229, 0.1)'
  },
  cia2: {
    title: 'CIA 2',
    description: "Generate CIA 2 internal assessment paper based on subject syllabus and Bloom's Taxonomy.",
    buttonText: 'Generate CIA 2',
    color: '#4f46e5',
    bgLight: 'rgba(79, 70, 229, 0.1)'
  },
  qbank: {
    title: 'Question Bank',
    description: "Generate unit-wise Question Bank with answers based on subject syllabus and Bloom's Taxonomy.",
    buttonText: 'Generate Question Bank',
    color: '#0ea5e9',
    bgLight: 'rgba(14, 165, 233, 0.1)'
  },
  quiz: {
    title: 'Quiz',
    description: 'Generate unit-wise Quiz question sets suitable for online assessment.',
    buttonText: 'Generate Quiz',
    color: '#673ab7',
    bgLight: 'rgba(103, 58, 183, 0.1)'
  },
  assignment: {
    title: 'Assignment',
    description: "Generate assignment questions and case study scenarios based on Bloom's Taxonomy.",
    buttonText: 'Generate Assignment',
    color: '#ec4899',
    bgLight: 'rgba(236, 72, 153, 0.1)'
  },
  hots: {
    title: 'HOTS',
    description: 'Generate Higher Order Thinking Skills (HOTS) questions for student evaluation.',
    buttonText: 'Generate HOTS',
    color: '#f59e0b',
    bgLight: 'rgba(245, 158, 11, 0.1)'
  },
  beyond: {
    title: 'Beyond Syllabus',
    description: 'Generate advanced topics, outlines, and activities extending beyond the standard syllabus.',
    buttonText: 'Generate Beyond Syllabus',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.1)'
  },
  sessionplan: {
    title: 'Session Plan',
    description: "Generate a complete period-wise teaching plan based on the subject syllabus, working weeks, classes per week, and Bloom's Taxonomy.",
    buttonText: 'Generate Session Plan',
    color: '#6366f1',
    bgLight: 'rgba(99, 102, 241, 0.1)'
  }
};

const CourseContent = () => {
  const navigate = useNavigate();
  const { user, logoutUser, department, regulation, year, semester, subject } = useAppContext();

  const tabs = subject?.isLab
    ? [
      { id: 'labmanual', label: 'Lab Manual' },
      { id: 'coursefile', label: 'Course File' },
      { id: 'syllabus', label: 'Subject Syllabus' }
    ]
    : [
      { id: 'cia1', label: 'CIA 1' },
      { id: 'cia2', label: 'CIA 2' },
      { id: 'qbank', label: 'Question Bank' },
      { id: 'quiz', label: 'Quiz' },
      { id: 'hots', label: 'HOTS' },
      { id: 'assignment', label: 'Assignment' },
      { id: 'beyond', label: 'Beyond Syllabus' },
      { id: 'sessionplan', label: 'Session Plan' },
      { id: 'coursefile', label: 'Course File' },
      { id: 'syllabus', label: 'Subject Syllabus' }
    ];

  const [activeTab, setActiveTab] = useState(() => {
    return subject?.isLab ? 'labmanual' : 'cia1';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [assignmentCount, setAssignmentCount] = useState(5);
  const [content, setContent] = useState('');
  const [labManualData, setLabManualData] = useState(null);
  const [syllabusBase64, setSyllabusBase64] = useState('');
  const [uploadedSyllabusFileName, setUploadedSyllabusFileName] = useState('');
  const [labManualProgress, setLabManualProgress] = useState(null);
  const [showLabManualSuccess, setShowLabManualSuccess] = useState(false);
  const [showLabManualPreview, setShowLabManualPreview] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef(null);
  const [editableFields, setEditableFields] = useState({
    collegeName: 'SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY',
    department: '',
    regulation: '',
    academicYear: '2025-26',
    semester: '',
    courseCode: '',
    courseName: '',
    facultyName: 'Faculty In-charge'
  });

  const handleSyllabusPdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedSyllabusFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result.split(',')[1];
        setSyllabusBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const [sessionPlanData, setSessionPlanData] = useState(null);
  const [sessionPlanSearch, setSessionPlanSearch] = useState('');

  const [showSessionPlanForm, setShowSessionPlanForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [sessionPlanForm, setSessionPlanForm] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const fourMonthsLater = new Date();
    fourMonthsLater.setMonth(fourMonthsLater.getMonth() + 4);
    const end = fourMonthsLater.toISOString().split('T')[0];
    return {
      academicYear: '2025-26',
      startDate: today,
      endDate: end,
      workingWeeks: 15,
      classesPerWeek: 4,
      classDuration: '1 Hour',
      teachingPreference: ''
    };
  });

  // Reset activeTab, content and data when subject changes
  useEffect(() => {
    if (subject) {
      setActiveTab(subject.isLab ? 'labmanual' : 'cia1');
      setContent('');
      setLabManualData(null);
      setSessionPlanData(null);
      setShowSessionPlanForm(false);
      setSyllabusBase64('');
      setUploadedSyllabusFileName('');
      setEditableFields({
        collegeName: 'SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY',
        department: department?.name ? department.name.replace(/^Department of\s+/i, '').toUpperCase() : '',
        regulation: regulation || '',
        academicYear: getAcademicYear(),
        semester: semester || '',
        courseCode: subject?.code || '',
        courseName: subject?.name || '',
        facultyName: subject?.staffName || 'Faculty In-charge'
      });
    }
  }, [subject, department, regulation, semester]);

  // Reset data when activeTab changes
  useEffect(() => {
    setSessionPlanData(null);
    setShowSessionPlanForm(false);
    setFormError('');
  }, [activeTab]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [appsScriptCode, setAppsScriptCode] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [directFormState, setDirectFormState] = useState({
    status: 'idle', // idle, auth, creating, success, error
    message: '',
    error: '',
    editUrl: '',
    responderUri: ''
  });
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Dynamically apply fixed viewport dashboard layout class
  useEffect(() => {
    if (activeTab === 'labmanual') {
      document.body.classList.remove('dashboard-layout');
    } else {
      document.body.classList.add('dashboard-layout');
    }
    return () => {
      document.body.classList.remove('dashboard-layout');
    };
  }, [activeTab]);

  // Manage body scroll locking when modals are active
  useEffect(() => {
    const isModalOpen = showFormModal || directFormState.status !== 'idle' || alertModal.isOpen;
    if (isModalOpen) {
      document.body.classList.add('body-scroll-lock');
    } else {
      document.body.classList.remove('body-scroll-lock');
    }
    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [showFormModal, directFormState.status, alertModal.isOpen]);

  // Handle click outside and Escape key for Download Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setIsDownloadDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDownloadDropdownOpen(false);
      }
    };

    if (isDownloadDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDownloadDropdownOpen]);

  if (!subject) {
    navigate('/subjects');
    return null;
  }

  const handleGenerateLabManual = async () => {
    setIsGenerating(true);
    setLabManualData(null);
    setContent('');
    setShowLabManualSuccess(false);
    setShowLabManualPreview(false);

    const initialSteps = [
      { label: 'Reading Subject Syllabus', status: 'pending' },
      { label: 'Extracting Experiments', status: 'pending' },
      { label: 'Loading College Template', status: 'pending' },
      { label: 'Generating Experiment 1 / 10', status: 'pending' },
      { label: 'Generating Experiment 2 / 10', status: 'pending' },
      { label: 'Generating Experiment 3 / 10', status: 'pending' },
      { label: 'Generating Experiment 4 / 10', status: 'pending' },
      { label: 'Generating Experiment 5 / 10', status: 'pending' },
      { label: 'Generating Experiment 6 / 10', status: 'pending' },
      { label: 'Generating Experiment 7 / 10', status: 'pending' },
      { label: 'Generating Experiment 8 / 10', status: 'pending' },
      { label: 'Generating Experiment 9 / 10', status: 'pending' },
      { label: 'Generating Experiment 10 / 10', status: 'pending' },
      { label: 'Building Cover Page', status: 'pending' },
      { label: 'Creating Index', status: 'pending' },
      { label: 'Preparing DOCX', status: 'pending' }
    ];

    setLabManualProgress({
      currentStepIndex: 0,
      percent: 0,
      steps: initialSteps
    });

    let activeIndex = 0;
    const totalStepsCount = initialSteps.length;
    
    const interval = setInterval(() => {
      setLabManualProgress(prev => {
        if (!prev) return null;
        const newSteps = [...prev.steps];
        
        if (activeIndex < totalStepsCount) {
          newSteps[activeIndex] = { ...newSteps[activeIndex], status: 'done' };
        }
        
        const nextIndex = activeIndex + 1;
        if (nextIndex < totalStepsCount) {
          newSteps[nextIndex] = { ...newSteps[nextIndex], status: 'running' };
          activeIndex = nextIndex;
        } else {
          clearInterval(interval);
        }

        let pct = 0;
        if (activeIndex === 0) pct = 5;
        else if (activeIndex === 1) pct = 10;
        else if (activeIndex === 2) pct = 15;
        else if (activeIndex >= 3 && activeIndex <= 12) {
          pct = 15 + (activeIndex - 2) * 7;
        } else if (activeIndex === 13) pct = 90;
        else if (activeIndex === 14) pct = 93;
        else if (activeIndex === 15) pct = 96;

        return {
          currentStepIndex: activeIndex,
          percent: pct,
          steps: newSteps
        };
      });
    }, 700);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-lab-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject,
          regulation: regulation,
          generatedBy: user?.username || 'faculty',
          syllabusPdf: syllabusBase64 || undefined
        })
      });
      const data = await response.json();
      
      clearInterval(interval);

      if (data.success && (data.experiments?.length > 0 || data.courseObjectives?.length > 0)) {
        setLabManualProgress(prev => {
          if (!prev) return null;
          const completedSteps = prev.steps.map(s => ({ ...s, status: 'done' }));
          return {
            currentStepIndex: completedSteps.length - 1,
            percent: 100,
            steps: completedSteps
          };
        });

        setTimeout(() => {
          setLabManualData(data);
          setShowLabManualSuccess(true);
        }, 600);
      } else {
        const errMsg = data.error || data.details || 'Lab manual generation failed or returned empty results.';
        console.error('[LabManual Frontend] Generation failed:', data);
        setContent(errMsg);
        setLabManualProgress(null);
      }
    } catch (err) {
      setContent(`Error: ${err.message}`);
      setLabManualProgress(null);
      clearInterval(interval);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSessionPlanMock = async () => {
    setIsGenerating(true);
    setSessionPlanData(null);
    setContent('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject,
          type: 'sessionplan',
          regulation: regulation,
          generatedBy: user?.username || 'faculty',
          workingWeeks: sessionPlanForm.workingWeeks,
          classesPerWeek: sessionPlanForm.classesPerWeek,
          classDuration: sessionPlanForm.classDuration,
          teachingPreference: sessionPlanForm.teachingPreference,
          academicYear: sessionPlanForm.academicYear,
          startDate: sessionPlanForm.startDate,
          endDate: sessionPlanForm.endDate
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSessionPlanData(data);
      } else {
        alert(data.error || 'Failed to generate session plan.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the server.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = () => {
    if (sessionPlanForm.workingWeeks <= 0) {
      setFormError('Working Weeks must be greater than 0.');
      return;
    }
    if (sessionPlanForm.classesPerWeek < 1 || sessionPlanForm.classesPerWeek > 7) {
      setFormError('Classes Per Week must be between 1 and 7.');
      return;
    }
    if (sessionPlanForm.startDate && sessionPlanForm.endDate) {
      const start = new Date(sessionPlanForm.startDate);
      const end = new Date(sessionPlanForm.endDate);
      if (end <= start) {
        setFormError('Semester End Date must be after the Start Date.');
        return;
      }
    }
    setFormError('');
    setShowSessionPlanForm(false);
    handleGenerateSessionPlanMock();
  };

  const handleGenerate = async () => {
    if (activeTab === 'labmanual') {
      await handleGenerateLabManual();
      return;
    }
    if (activeTab === 'sessionplan') {
      handleFormSubmit();
      return;
    }
    setIsGenerating(true);
    setContent('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject, // subject contains { code, name, ... }
          type: activeTab,
          regulation: regulation,
          generatedBy: user?.username || 'faculty',
          assignmentCount: activeTab === 'assignment' ? assignmentCount : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContent(data.generatedText);
      } else {
        setContent(`Error: ${data.error || 'Failed to generate content'}`);
        console.error('Generation error:', data);
      }
    } catch (error) {
      console.error("Error generating content", error);
      setContent('Error: Could not connect to the generation server. Is the backend running?');
    } finally {
      setIsGenerating(false);
    }
  };

  // Strips markdown formatting emphasis characters (*, _, **) from a string.
  const stripMarkdownFormatting = (text) => {
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
  };

  // Cleans CO and K references from the text to prevent duplication in dedicated columns.
  const cleanAllTextOfCOK = (text) => {
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
  };

  // Convert Markdown to HTML for exports
  const renderMarkdownToHtml = (md) => {
    if (!md) return '';
    let cleaned = cleanAllTextOfCOK(md);
    // Quick simple markdown parser for bold, headers, list, etc.
    let html = cleaned
      .replace(/^### (.*$)/gim, '<h3 style="color:#4f46e5; margin-top:20px; font-size:14pt; font-family:\'Times New Roman\', Times, serif;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#4f46e5; margin-top:25px; font-size:16pt; font-family:\'Times New Roman\', Times, serif;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#4f46e5; margin-top:30px; font-size:18pt; font-family:\'Times New Roman\', Times, serif;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 5px; font-family:\'Times New Roman\', Times, serif;">$1</li>')
      // Format MCQ Options (lines starting with option indicators)
      .replace(/^\s*([a-d][\)\.])\s*(.*)$/gim, '<div style="margin-left: 20px; color: #334155; margin-bottom: 3px; font-family:\'Times New Roman\', Times, serif;">$1 $2</div>')
      // Format Correct answer lines
      .replace(/^\s*(Correct\s*:\s*.*)$/gim, '<div style="margin-left: 20px; margin-bottom: 12px; color: #15803d; font-weight: bold; font-family:\'Times New Roman\', Times, serif;">$1</div>')
      // Format Questions lines (lines starting with Q1., Q2., or 1., 2.)
      .replace(/^\s*(Q?\d+[\.\)]\s*.*)$/gim, '<div style="font-weight: bold; margin-top: 15px; margin-bottom: 6px; font-family:\'Times New Roman\', Times, serif;">$1</div>')
      .replace(/\n/gim, '<br />');
    return html;
  };

  // ===================== QUESTION PARSER (mirrors backend) =====================
  const parseQuestionsForPDF = (text) => {
    const questions = {};
    if (!text) return questions;

    // Split into sections
    const partAIdx = text.search(/Part\s*A/i);
    const partBIdx = text.search(/Part\s*B/i);
    const partCIdx = text.search(/Part\s*C/i);

    let partAText = '';
    let partBText = '';

    if (partAIdx !== -1) {
      if (partBIdx !== -1) {
        partAText = text.substring(partAIdx, partBIdx);
        if (partCIdx !== -1) {
          partBText = text.substring(partBIdx, partCIdx) + '\n' + text.substring(partCIdx);
        } else {
          partBText = text.substring(partBIdx);
        }
      } else {
        partAText = text.substring(partAIdx);
      }
    } else {
      partAText = text;
      partBText = text;
    }

    const clean = (txt) => {
      if (!txt) return '';
      let cleaned = stripMarkdownFormatting(txt)
        .replace(/^\s*[\-\*\+]\s+/, '') // Strip list bullets
        .trim();
      return cleanAllTextOfCOK(cleaned);
    };

    const cleanOption = (txt) => {
      if (!txt) return '';
      let cleaned = clean(txt);
      // Remove any trailing/internal "Part C" headings, marks declarations, or instructions
      cleaned = cleaned.replace(/(?:^|\n)\s*#+\s*Part\s*[A-Z].*$/gim, '');
      cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?Answer\s+(?:all|either|any).*$/gim, '');
      cleaned = cleaned.replace(/(?:^|\n)\s*\*?\(?\d+\s*x\s*\d+\s*=\s*\d+\s*Marks.*$/gim, '');
      cleaned = cleaned.replace(/(?:^|\n)\s*-+\s*$/gm, '');
      return clean(cleaned);
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
            questions[`Q${i}`] = clean(m[1]);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    // --- Parse Part B ---
    const findQuestionSegment = (srcText, num) => {
      const startRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${num}(?:\\b|[a-z])`, 'i');
      const startMatch = srcText.match(startRegex);
      if (!startMatch) return '';

      const nextNum = num + 1;
      const endRegex = new RegExp(`(?:^|\\n)\\s*\\**\\s*(?:Question|Q|\\*\\*)?\\s*${nextNum}(?:\\b|[a-z])`, 'i');
      const endMatch = srcText.match(endRegex);

      if (endMatch) {
        return srcText.substring(startMatch.index, endMatch.index);
      } else {
        return srcText.substring(startMatch.index);
      }
    };

    const parseOption = (segment, letter) => {
      const lLower = letter.toLowerCase();
      const lUpper = letter.toUpperCase();
      const lClass = `[${lLower}${lUpper}]`;
      const anyClass = `[a-bA-B]`;

      const patterns = [
        new RegExp(`(?:\\b|\\()\\s*(?:\\d+)?${lClass}\\s*[\\.\\):]\\s*\\*?\\*?\\s*([\\s\\S]+?)(?=(?:\\b|\\()\\s*(?:\\d+)?${anyClass}\\s*[\\.\\):]|\\b(?:OR|Or|\\*\\*OR\\*\\*|\\*\\*Or\\*\\*)\\b|$)`)
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

    const partBKeys = [
      { key: '11a', num: 11, letter: 'a' },
      { key: '11b', num: 11, letter: 'b' },
      { key: '12a', num: 12, letter: 'a' },
      { key: '12b', num: 12, letter: 'b' },
      { key: '13a', num: 13, letter: 'a' },
      { key: '13b', num: 13, letter: 'b' }
    ];

    for (const item of partBKeys) {
      const segment = findQuestionSegment(partBText, item.num);
      if (segment) {
        questions[`Q${item.key}`] = parseOption(segment, item.letter);
      }
    }

    return questions;
  };

  // Roman numeral converter
  const toRoman = (num) => {
    const n = parseInt(num, 10);
    if (isNaN(n) || n <= 0) return String(num || '');
    const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let result = '';
    let r = n;
    for (const [v, s] of map) { while (r >= v) { result += s; r -= v; } }
    return result;
  };

  const getAcademicYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 5 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  };

  const getBranchName = (deptId) => {
    const map = { 'AI_DS': 'AI&DS', 'AIDS': 'AI&DS', 'CSE': 'CSE', 'IT': 'IT', 'ECE': 'ECE', 'EEE': 'EEE', 'MECH': 'MECH' };
    return map[deptId] || deptId || 'N/A';
  };

  const formatRegulation = (reg) => {
    if (!reg) return 'N/A';
    if (reg.includes('-')) return reg;
    const m = reg.match(/^(R)(\d+)$/i);
    return m ? `${m[1]}-${m[2]}` : reg;
  };

  // PDF Export using native print optimization window
  const handleExportPDF = () => {
    const isCIA = (activeTab === 'cia1' || activeTab === 'cia2');
    const printWindow = window.open('', '_blank');
    const docTitle = `${subject.code}_${activeTab.toUpperCase()}_CourseFile`;

    if (isCIA) {
      // === HIGH-FIDELITY CIA QUESTION PAPER PDF ===
      const q = parseQuestionsForPDF(content);
      const yearSem = `${toRoman(year)}/${toRoman(semester)}`;
      const academicYear = getAcademicYear();
      const branch = getBranchName(department.id);
      const reg = formatRegulation(regulation);
      const ciaLabel = activeTab === 'cia1' ? 'I' : 'II';

      // Part A rows
      const coMapping = ['CO3', 'CO3', 'CO4', 'CO4', 'CO4', 'CO4', 'CO5', 'CO5', 'CO5', 'CO5'];
      const kxMapping = ['K1', 'K2', 'K1', 'K2', 'K1', 'K1', 'K1', 'K1', 'K1', 'K1'];
      let partARows = '';
      for (let i = 1; i <= 10; i++) {
        partARows += `<tr>
          <td style="width:60px;text-align:center;font-size:10pt;">${i}.</td>
          <td style="font-size:10pt;padding:4px 6px;">${q[`Q${i}`] || ''}</td>
          <td style="width:60px;text-align:center;font-size:9pt;">${coMapping[i - 1]}</td>
          <td style="width:50px;text-align:center;font-size:9pt;">${kxMapping[i - 1]}</td>
        </tr>`;
      }

      // Part B rows
      const partBData = [
        { qNo: '11a', marks: 16, co: 'CO4', kx: 'K4' },
        { type: 'or' },
        { qNo: '11b', marks: 16, co: 'CO4', kx: 'K4' },
        { qNo: '12a', marks: 16, co: 'CO5', kx: 'K3' },
        { type: 'or' },
        { qNo: '12b', marks: 16, co: 'CO5', kx: 'K3' },
        { qNo: '13a', marks: 8, co: 'CO3', kx: 'K3' },
        { type: 'or' },
        { qNo: '13b', marks: 8, co: 'CO3', kx: 'K3' },
      ];

      let partBRows = '';
      for (const row of partBData) {
        if (row.type === 'or') {
          partBRows += `<tr><td colspan="6" style="text-align:center;font-weight:bold;font-size:10pt;padding:2px;">OR</td></tr>`;
        } else {
          partBRows += `<tr>
            <td style="width:60px;text-align:center;font-size:10pt;">${row.qNo}.</td>
            <td style="font-size:10pt;padding:4px 6px;">${q[`Q${row.qNo}`] || ''}</td>
            <td style="width:60px;text-align:center;font-size:9pt;">${row.marks}</td>
            <td style="width:50px;text-align:center;font-size:9pt;">${row.co}</td>
            <td style="width:50px;text-align:center;font-size:9pt;">${row.kx}</td>
          </tr>`;
        }
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              @page { size: A4; margin: 1.5cm 1cm; }
              body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 10px; font-size: 11pt; }
              table { border-collapse: collapse; width: 100%; }
              .header-cell { text-align: center; padding: 6px; }
              .college-name { font-size: 14pt; font-weight: bold; }
              .auto-inst { font-size: 10pt; }
              .address { font-size: 9pt; }
              .meta-table td { padding: 3px 6px; font-size: 10pt; font-weight: bold; }
              .meta-table .val { font-weight: normal; }
              .cia-header { background: #f2f2f2; text-align: center; font-weight: bold; font-size: 11pt; padding: 6px; }
              .co-table td { padding: 3px 6px; font-size: 10pt; }
              .co-label { font-weight: bold; width: 60px; }
              .section-header { text-align: center; font-weight: bold; font-size: 11pt; padding: 6px; }
              .q-table { margin-top: 8px; }
              .q-table th { font-weight: bold; font-size: 10pt; text-align: center; padding: 4px; background: #fafafa; }
              .q-table td { border: 1px solid #000; vertical-align: top; }
              .q-table th { border: 1px solid #000; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <!-- College Header -->
            <table style="border:none;margin-bottom:4px;">
              <tr>
                <td class="header-cell" style="border:none;">
                  <div class="college-name">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
                  <div class="auto-inst">(An Autonomous Institution)</div>
                  <div class="address">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</div>
                </td>
              </tr>
            </table>

            <!-- CIA Title + Metadata Table -->
            <table style="border:1px solid #000;margin-top:6px;" class="meta-table">
              <tr><td colspan="4" class="cia-header">CONTINUOUS INTERNAL ASSESSMENT – ${ciaLabel}  (CIA- ${ciaLabel})</td></tr>
              <tr>
                <td style="border:1px solid #000;">Year / Sem :</td>
                <td style="border:1px solid #000;" class="val">${yearSem}</td>
                <td style="border:1px solid #000;">Academic Year :</td>
                <td style="border:1px solid #000;" class="val">${academicYear}</td>
              </tr>
              <tr>
                <td style="border:1px solid #000;">Branch / Section :</td>
                <td style="border:1px solid #000;" class="val">${branch}</td>
                <td style="border:1px solid #000;">Date of Exam :</td>
                <td style="border:1px solid #000;" class="val"></td>
              </tr>
              <tr>
                <td style="border:1px solid #000;">Duration :</td>
                <td style="border:1px solid #000;" class="val">100 minutes</td>
                <td style="border:1px solid #000;">Maximum Marks :</td>
                <td style="border:1px solid #000;text-align:center;" class="val">60</td>
              </tr>
              <tr>
                <td style="border:1px solid #000;">Regulations :</td>
                <td style="border:1px solid #000;" class="val">${reg}</td>
                <td style="border:1px solid #000;" colspan="2"></td>
              </tr>
              <tr>
                <td colspan="4" style="border:1px solid #000;font-size:10pt;">COURSE CODE / COURSE NAME: <span class="val">${subject.code} - ${subject.name}</span></td>
              </tr>
            </table>

            <!-- Course Outcomes Table -->
            <table style="border:1px solid #000;margin-top:6px;" class="co-table">
              <tr><td colspan="2" style="border:1px solid #000;text-align:center;font-weight:bold;background:#f2f2f2;">COURSE OUTCOMES</td></tr>
              <tr><td class="co-label" style="border:1px solid #000;">CO3:</td><td style="border:1px solid #000;">Understand and apply the fundamental concepts of the subject.</td></tr>
              <tr><td class="co-label" style="border:1px solid #000;">CO4:</td><td style="border:1px solid #000;">Analyze and evaluate complex problems using subject knowledge.</td></tr>
              <tr><td class="co-label" style="border:1px solid #000;">CO5:</td><td style="border:1px solid #000;">Design and create solutions applying higher-order thinking skills.</td></tr>
            </table>

            <!-- Part A Table -->
            <table class="q-table" style="margin-top:10px;">
              <tr><td colspan="4" class="section-header" style="border:1px solid #000;">ANSWER ALL THE QUESTIONS : PART A (10 x 2 = 20 Marks)</td></tr>
              <tr><th>Q.No</th><th></th><th>CO</th><th>Kx</th></tr>
              ${partARows}
            </table>

            <!-- Part B Table -->
            <table class="q-table" style="margin-top:10px;">
              <tr><td colspan="6" class="section-header" style="border:1px solid #000;">ANSWER ALL THE QUESTIONS : PART B (2x16=32 Marks & 1x8=8 Marks)</td></tr>
              <tr><th>Q.No</th><th></th><th>Marks</th><th>CO</th><th>Kx</th></tr>
              ${partBRows}
            </table>

            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (activeTab === 'beyond') {
      // === HIGH-FIDELITY BEYOND SYLLABUS PRINT ===
      const yearSem = `${toRoman(year)}/${toRoman(semester)}`;
      const academicYear = getAcademicYear();
      const branch = getBranchName(department.id);

      const ayStart = parseInt(academicYear.split('-')[0], 10);
      const batchStart = ayStart - parseInt(year, 10) + 1;
      const batchEnd = batchStart + 4;
      const batchStr = `${batchStart} – ${batchEnd}`;

      // Helper to parse beyond markdown
      const parseBeyondMarkdown = (txt) => {
        const units = [];
        // Match headers like "### Unit I: Title" or "### Unit 1: Title"
        const matches = [...txt.matchAll(/(?:^|\n)\s*###+\s*(Unit\s+[IVX\d]+[:\-\s].*?)(?=\n|$)/gi)];

        for (let idx = 0; idx < matches.length; idx++) {
          const header = matches[idx][1].trim();
          const startIdx = matches[idx].index + matches[idx][0].length;
          const endIdx = matches[idx + 1] ? matches[idx + 1].index : txt.length;
          const unitBody = txt.substring(startIdx, endIdx).trim();

          const lines = unitBody.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const topics = [];

          for (const line of lines) {
            const m = line.match(/^\s*(\d+)[\.\)]\s*(.*?)\s*[\–\-\—\:]\s*(.*)/);
            if (m) {
              topics.push({
                num: m[1].trim(),
                name: m[2].replace(/\*+|_+/g, '').trim(),
                desc: m[3].replace(/\*+|_+/g, '').trim()
              });
            } else {
              const m_fallback = line.match(/^\s*(\d+)[\.\)]\s*(.*)/);
              if (m_fallback) {
                const fullText = m_fallback[2].replace(/\*+|_+/g, '').trim();
                const parts = fullText.split("  ", 2);
                topics.push({
                  num: m_fallback[1].trim(),
                  name: parts[0].trim(),
                  desc: parts[1] ? parts[1].trim() : ""
                });
              }
            }
          }

          const titleParts = header.split(':');
          const unitTitle = titleParts[1] ? titleParts[1].replace(/\*+|_+/g, '').trim() : header.replace(/\*+|_+/g, '').trim();

          units.push({
            title: unitTitle,
            topics: topics
          });
        }
        return units;
      };

      const parsedUnits = parseBeyondMarkdown(content);
      const romanNums = ["I", "II", "III", "IV", "V"];

      let unitsHtml = '';
      parsedUnits.forEach((unit, uIdx) => {
        const roman = romanNums[uIdx] || String(uIdx + 1);
        unitsHtml += `
          <div class="unit-container" style="page-break-inside: avoid; margin-bottom: 12px;">
            <div class="unit-title" style="text-align: center; font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 4px; text-transform: uppercase;">UNIT ${roman} – ${unit.title.toUpperCase()}</div>
            <div class="beyond-label" style="font-weight: bold; font-size: 11pt; margin-bottom: 4px;">Beyond-the-Syllabus Topics:</div>
            <div class="topics-list">
              ${unit.topics.map(t => `
                <div class="topic-item" style="margin-bottom: 4px; text-align: justify; font-size: 11pt;">
                  <span class="topic-num-name" style="font-weight: bold;">${t.num}. ${t.name}</span>
                  <span class="topic-divider">–</span>
                  <span class="topic-desc">${t.desc}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });

      const staffName = subject.staffName || 'R.ASHA';

      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              @page { size: A4; margin: 2cm 1.5cm; }
              body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 0; font-size: 11pt; line-height: 1.4; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <!-- College Header -->
            <div class="header-container" style="text-align: center; margin-bottom: 15px;">
              <div class="college-name" style="font-size: 14pt; font-weight: bold; margin-bottom: 2px;">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
              <div class="dept-name" style="font-size: 12pt; font-weight: bold; margin-bottom: 2px;">DEPARTMENT OF ${branch.toUpperCase()}</div>
              <div class="doc-title" style="font-size: 12pt; font-weight: bold; margin-bottom: 2px;">Content Beyond Syllabus</div>
              <div class="academic-year" style="font-size: 11pt; font-weight: bold; margin-bottom: 10px;">Academic Year (${academicYear})</div>
            </div>

            <!-- Metadata Details -->
            <table class="meta-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
              <tr>
                <td style="font-weight: bold; width: 220px; padding: 3px 0; vertical-align: top;">Name of the Faculty :</td>
                <td style="padding: 3px 0; vertical-align: top;">${staffName}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">Subject Code / Subject Name :</td>
                <td style="padding: 3px 0; vertical-align: top;">${subject.code} / ${subject.name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">Year / Semester :</td>
                <td style="padding: 3px 0; vertical-align: top;">${yearSem}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">Batch :</td>
                <td style="padding: 3px 0; vertical-align: top;">${batchStr}</td>
              </tr>
            </table>

            <!-- Content Area -->
            <div class="content-area">
              ${unitsHtml}
            </div>

            <!-- Footer Sign-off -->
            <div class="footer-signoff" style="margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11pt; page-break-inside: avoid;">
              <div>COURSE INSTRUCTOR</div>
              <div>HOD</div>
            </div>
            
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (activeTab === 'hots' || activeTab === 'assignment') {
      // === HIGH-FIDELITY HOTS & ASSIGNMENT PRINT ===
      const yearSem = `${toRoman(year)}/${toRoman(semester)}`;
      const academicYear = getAcademicYear();

      const getFullBranchName = (dept) => {
        if (!dept) return '';
        const name = dept.name || '';
        return name.replace(/^Department of\s+/i, '').toUpperCase();
      };

      const ayStart = parseInt(academicYear.split('-')[0], 10);
      const batchStart = ayStart - parseInt(year, 10) + 1;
      const batchEnd = batchStart + 4;
      const batchStr = `${batchStart} – ${batchEnd}`;

      const parseHotsMarkdown = (txt) => {
        const units = [];
        const matches = [...txt.matchAll(/(?:^|\n)\s*###+\s*(Unit\s+[IVX\d]+[:\-\s].*?)(?=\n|$)/gi)];

        for (let idx = 0; idx < matches.length; idx++) {
          const header = matches[idx][1].trim();
          const startIdx = matches[idx].index + matches[idx][0].length;
          const endIdx = matches[idx + 1] ? matches[idx + 1].index : txt.length;
          const unitBody = txt.substring(startIdx, endIdx).trim();

          const lines = unitBody.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const questions = [];

          for (const line of lines) {
            const m = line.match(/^\s*(\d+)[\.\)]\s*(.*)/);
            if (m) {
              questions.push({
                num: m[1].trim(),
                text: m[2].replace(/\*+|_+/g, '').trim()
              });
            }
          }

          const titleParts = header.split(':');
          const unitTitle = titleParts[1] ? titleParts[1].replace(/\*+|_+/g, '').trim() : header.replace(/\*+|_+/g, '').trim();

          units.push({
            title: unitTitle,
            questions: questions
          });
        }
        return units;
      };

      const parseAssignmentMarkdown = (txt) => {
        const lines = txt.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const questions = [];
        for (const line of lines) {
          const m = line.match(/^\s*(\d+)[\.\)]\s*(.*)/);
          if (m) {
            questions.push({
              num: m[1].trim(),
              text: m[2].replace(/\*+|_+/g, '').trim()
            });
          }
        }
        return questions;
      };

      let contentHtml = '';
      if (activeTab === 'hots') {
        const units = parseHotsMarkdown(content);
        const romanNums = ["I", "II", "III", "IV", "V"];

        units.forEach((unit, uIdx) => {
          const roman = romanNums[uIdx] || String(uIdx + 1);
          contentHtml += `
            <div class="unit-title">UNIT ${roman} – ${unit.title.toUpperCase()}</div>
            <div class="questions-list">
              ${unit.questions.map(q => `
                <div class="question-p">
                  ${q.num}. ${q.text}
                </div>
              `).join('')}
            </div>
          `;
        });
      } else {
        const questions = parseAssignmentMarkdown(content);
        contentHtml += '<div class="questions-list" style="margin-top: 20px;">';
        questions.forEach(q => {
          contentHtml += `
            <div class="question-p">
              ${q.num}. ${q.text}
            </div>
          `;
        });
        contentHtml += '</div>';
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              @page { size: A4; margin: 1.5cm 1cm; }
              body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 10px; font-size: 11pt; line-height: 1.2; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
              td { padding: 4px 6px; font-size: 11pt; font-family: 'Times New Roman', Times, serif; }
              .logo-table td { border: none; padding: 0; vertical-align: middle; }
              .meta-table { border: 1px solid #000; width: 100%; }
              .meta-table td { border: 1px solid #000; font-weight: bold; }
              .meta-table td.val { font-weight: normal; }
              .title-p { text-align: center; font-weight: bold; font-size: 12pt; margin: 15px 0 5px 0; }
              .dept-p { text-align: center; font-weight: bold; font-size: 11pt; margin: 5px 0; text-transform: uppercase; }
              .ay-p { text-align: center; font-weight: bold; font-size: 11pt; margin: 5px 0 15px 0; }
              .unit-title { text-align: center; font-weight: bold; font-size: 11pt; margin: 25px 0 10px 0; text-transform: uppercase; }
              .question-p { text-align: justify; font-size: 11pt; margin-bottom: 12pt; margin-top: 0; line-height: 1.15; }
              .footer-signoff { margin-top: 50px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11pt; page-break-inside: avoid; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <!-- College Header -->
            <table class="logo-table">
              <tr>
                <td style="width: 80px; text-align: center;">
                  <img src="/logo.png" style="width: 70px; height: auto;" alt="Logo" />
                </td>
                <td style="text-align: center; padding-left: 10px;">
                  <div style="font-size: 14pt; font-weight: bold; font-family: 'Times New Roman', Times, serif; line-height: 1.3;">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
                  <div style="font-size: 10pt; font-family: 'Times New Roman', Times, serif; font-weight: normal; margin-top: 2px;">(An Autonomous Institution)</div>
                  <div style="font-size: 9pt; font-family: 'Times New Roman', Times, serif; font-weight: normal; margin-top: 2px;">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</div>
                </td>
              </tr>
            </table>

            <!-- Department and Title -->
            <div class="dept-p">DEPARTMENT OF ${getFullBranchName(department)}</div>
            <div class="title-p">${activeTab === 'hots' ? 'HOTS (Higher Order Thinking Skills) Questions' : 'Assignment Questions'}</div>
            <div class="ay-p">Academic Year (${academicYear})</div>

            <!-- Metadata Details Table -->
            <table class="meta-table">
              <tr>
                <td style="width: 35%; border: 1px solid #000;">Name of the Faculty :</td>
                <td class="val" style="width: 65%; border: 1px solid #000;">${subject.staffName || 'Faculty member'}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Subject Code / Subject Name :</td>
                <td class="val" style="border: 1px solid #000;">${subject.code} / ${subject.name}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Year / Semester :</td>
                <td class="val" style="border: 1px solid #000;">${yearSem}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Batch :</td>
                <td class="val" style="border: 1px solid #000;">${batchStr}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000;">Regulations :</td>
                <td class="val" style="border: 1px solid #000;">${formatRegulation(regulation)}</td>
              </tr>
            </table>

            <!-- Questions Area -->
            <div class="content-area">
              ${contentHtml}
            </div>

            <!-- Footer Sign-off -->
            <div class="footer-signoff">
              <div>COURSE INSTRUCTOR</div>
              <div>HOD</div>
            </div>
            
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (activeTab === 'labmanual') {
      // === HIGH-FIDELITY LAB MANUAL PDF ===
      if (labManualData) {
        const deptVM = getDeptVM(editableFields.department);
        const displayDept = editableFields.department || 'Computer Science and Engineering';
        const displayYear = editableFields.academicYear;
        const displaySem = editableFields.semester;

        let html = '';

        // 1. Cover Page
        html += `
          <div class="page" style="text-align: center; padding: 40px 20px; min-height: 90vh; display: flex; flexDirection: column; justify-content: space-between; border: 2px solid #ea580c; margin: 10px; box-sizing: border-box;">
            <div>
              <h1 style="font-size: 20pt; font-weight: bold; margin-bottom: 5px;">${editableFields.collegeName.toUpperCase()}</h1>
              <h3 style="font-size: 12pt; font-weight: normal; margin-top: 0;">(An Autonomous Institution)</h3>
              <p style="font-size: 10pt; margin-bottom: 20px;">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</p>
              
              <div style="margin: 20px 0;">
                <img src="/logo.png" style="width: 90px; height: auto;" alt="Logo" onError="this.style.display='none'" />
              </div>
              
              <h2 style="font-size: 15pt; font-weight: bold; margin-top: 20px; text-transform: uppercase;">DEPARTMENT OF ${displayDept.toUpperCase()}</h2>
              
              <div style="border: 2px solid #ea580c; padding: 10px 30px; display: inline-block; margin: 25px auto; font-size: 15pt; font-weight: bold; color: #ea580c; letter-spacing: 2px; text-transform: uppercase;">
                RECORD NOTEBOOK
              </div>
            </div>
            
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 85%; margin: 20px auto; text-align: left; font-size: 11pt;">
              <tr><td style="font-weight: bold; width: 40%;">Course Code</td><td><strong>${editableFields.courseCode}</strong></td></tr>
              <tr><td style="font-weight: bold;">Course Name</td><td><strong>${editableFields.courseName}</strong></td></tr>
              <tr><td style="font-weight: bold;">Regulation</td><td>${formatRegulation(editableFields.regulation)}</td></tr>
              <tr><td style="font-weight: bold;">Academic Year</td><td>${displayYear}</td></tr>
              <tr><td style="font-weight: bold;">Semester</td><td>Sem ${editableFields.semester}</td></tr>
            </table>
            
            <div style="border: 2px solid #ea580c; border-radius: 12px; padding: 20px; width: 85%; margin: 20px auto; text-align: left; font-size: 11pt; box-sizing: border-box;">
              <div style="display: flex; margin-bottom: 12px;"><span style="font-weight: bold; width: 150px;">NAME:</span><span style="border-bottom: 1px solid #aaa; flex: 1;"></span></div>
              <div style="display: flex; margin-bottom: 12px;"><span style="font-weight: bold; width: 150px;">REGISTER NO:</span><span style="border-bottom: 1px solid #aaa; flex: 1;"></span></div>
              <div style="display: flex; margin-bottom: 12px;"><span style="font-weight: bold; width: 150px;">BRANCH / YEAR:</span><span style="border-bottom: 1px solid #aaa; flex: 1;">${displayDept} / ${editableFields.academicYear.split('-')[0] || ''}</span></div>
              <div style="display: flex;"><span style="font-weight: bold; width: 150px;">SEMESTER:</span><span style="border-bottom: 1px solid #aaa; flex: 1;">${displaySem}</span></div>
            </div>
          </div>
        `;

        // 2. Certificate Page
        html += `
          <div class="page" style="padding: 40px 20px; min-height: 90vh; border: 2px solid #ea580c; margin: 10px; box-sizing: border-box; text-align: center;">
            <h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 5px;">${editableFields.collegeName.toUpperCase()}</h1>
            <h3 style="font-size: 11pt; font-weight: normal; margin-top: 0;">(An Autonomous Institution)</h3>
            <p style="font-size: 9pt; margin-bottom: 20px;">Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</p>
            
            <div style="margin: 20px 0;">
              <img src="/logo.png" style="width: 80px; height: auto;" alt="Logo" onError="this.style.display='none'" />
            </div>
            
            <div style="font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 20px 0;">RECORD NOTEBOOK</div>
            <div style="font-size: 11pt; text-align: left; width: 85%; margin: 10px auto; font-weight: bold;">REGISTER NUMBER: .......................................</div>
            
            <p style="font-size: 11.5pt; text-align: justify; line-height: 2.2; margin: 30px auto; width: 85%;">
              Certified that this is a bonafide record of Practical work done by Mr./Ms. ____________________________________________________ 
              of the <strong>${editableFields.semester} Semester</strong> in the <strong>${editableFields.courseCode} - ${editableFields.courseName}</strong> 
              Laboratory in the Department of <strong>${displayDept}</strong> during the academic year <strong>${displayYear}</strong>.
            </p>
            
            <table style="width: 85%; border: none; margin: 60px auto 30px auto; font-size: 11pt;">
              <tr>
                <td style="width: 50%; font-weight: bold; text-align: center; border: none;">
                  <div style="margin-top: 40px;">Signature of Staff In-charge</div>
                </td>
                <td style="width: 50%; font-weight: bold; text-align: center; border: none;">
                  <div style="margin-top: 40px;">Signature of Head of Department</div>
                </td>
              </tr>
            </table>
            
            <p style="font-size: 10.5pt; margin-top: 50px; text-align: justify; width: 85%; margin-left: auto; margin-right: auto;">
              Submitted for the Autonomous End Semester Practical Examination held on ______________________.
            </p>
            
            <table style="width: 85%; border: none; margin: 40px auto 0 auto; font-size: 11pt;">
              <tr>
                <td style="width: 50%; font-weight: bold; text-align: center; border: none;">INTERNAL EXAMINER</td>
                <td style="width: 50%; font-weight: bold; text-align: center; border: none;">EXTERNAL EXAMINER</td>
              </tr>
            </table>
          </div>
        `;

        // 3. Vision & Mission
        html += `
          <div class="page" style="padding-top: 20px; page-break-before: always;">
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">VISION OF THE INSTITUTE</h2>
            <p style="text-align: justify; line-height: 1.6; font-size: 11pt;">To be an institute of repute in the field of engineering and technology by implementing the best educational practices akin to global standards for fostering domain knowledge and developing research attitude among students to make them globally competent.</p>
            
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">MISSION OF THE INSTITUTE</h2>
            <ul style="line-height: 1.6; font-size: 11pt; padding-left: 20px;">
              <li>Achieving excellence in Teaching Learning process using state-of-the-art resources.</li>
              <li>Extending opportunity to upgrade faculty knowledge and skills.</li>
              <li>Implementing the best student training practices for requirements of industrial scenario of the state.</li>
              <li>Motivating faculty and students in research activity for real time application.</li>
            </ul>
            
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 40px; text-transform: uppercase;">VISION OF THE DEPARTMENT</h2>
            <p style="text-align: justify; line-height: 1.6; font-size: 11pt;">${deptVM.vision}</p>
            
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">MISSION OF THE DEPARTMENT</h2>
            <ul style="line-height: 1.6; font-size: 11pt; padding-left: 20px;">
              ${deptVM.mission.map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
        `;

        // 4. PEO, PO & PSO
        html += `
          <div class="page" style="padding-top: 20px; page-break-before: always;">
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">PROGRAM EDUCATIONAL OBJECTIVES (PEOs)</h2>
            <ul style="line-height: 1.6; font-size: 11pt; padding-left: 20px;">
              <li><strong>PEO 1:</strong> Graduates will be able to demonstrate their technical skills and competency in various applications by providing creative and novel technological solutions.</li>
              <li><strong>PEO 2:</strong> Graduates will be able to ensure the effective contribution to the society through critical thinking, innovations and research with the broad spectrum of skills in frontline technologies.</li>
              <li><strong>PEO 3:</strong> Graduates will be equipped with multidisciplinary initiatives and visions towards the growth of society with respect to ethical and lifelong learning.</li>
            </ul>
            
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">PROGRAM SPECIFIC OUTCOMES (PSOs)</h2>
            <ul style="line-height: 1.6; font-size: 11pt; padding-left: 20px;">
              ${deptVM.psos.map((pso, idx) => `<li><strong>PSO ${idx + 1}:</strong> ${pso}</li>`).join('')}
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

        // 5. Course Objectives & outcomes
        html += `
          <div class="page" style="padding-top: 20px; page-break-before: always;">
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">COURSE OBJECTIVES</h2>
            <ol style="line-height: 1.6; font-size: 11pt; padding-left: 20px;">
              ${(labManualData.courseObjectives || []).map(obj => `<li>${obj}</li>`).join('')}
            </ol>
            
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase;">COURSE OUTCOMES (COs)</h2>
            <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; font-size: 10pt; margin-top: 10px;">
              <tr style="background-color: #f2f2f2;">
                <th style="width: 15%; text-align: center;">CO No.</th>
                <th style="width: 65%; text-align: left;">Course Outcome Description</th>
                <th style="width: 20%; text-align: center;">Bloom's Level</th>
              </tr>
              ${(labManualData.courseOutcomes || []).map(co => `
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
              ${(labManualData.coPoMapping || []).map(row => `
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
          <div class="page" style="padding-top: 20px; page-break-before: always;">
            <h2 style="font-size: 14pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; text-transform: uppercase;">LIST OF EXPERIMENTS</h2>
            <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; font-size: 10pt; margin-top: 15px;">
              <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
                <th style="width: 10%;">Ex.No</th>
                <th style="width: 60%; text-align: left;">Experiment Title</th>
                <th style="width: 15%;">Mapped CO</th>
                <th style="width: 15%;">Bloom's Level</th>
              </tr>
              ${(labManualData.experiments || []).map(exp => `
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
          <div class="page" style="padding-top: 20px; page-break-before: always;">
            <h2 style="font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 30px;">TABLE OF CONTENTS</h2>
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; font-size: 11pt; margin-top: 15px;">
              <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
                <th style="width: 8%;">S.No</th>
                <th style="width: 15%;">Date</th>
                <th style="width: 52%; text-align: left;">Name of the Experiment</th>
                <th style="width: 10%;">Marks</th>
                <th style="width: 15%;">Signature</th>
              </tr>
              ${(labManualData.experiments || []).map(exp => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${exp.no}</td>
                  <td></td>
                  <td style="text-align: left; padding-left: 10px;">${exp.title}</td>
                  <td></td>
                  <td></td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;

        // 8. Detailed Experiments
        (labManualData.experiments || []).forEach(exp => {
          html += `
            <div class="page" style="page-break-before: always; padding-top: 20px; line-height: 1.5;">
              <table style="width: 100%; border: none; font-size: 11pt; font-weight: bold; margin-bottom: 15px;">
                <tr>
                  <td style="border: none;">EX. NO: ${exp.no}</td>
                  <td align="right" style="border: none;">DATE: __________________</td>
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
              
              <table style="width: 100%; border: none; font-size: 10.5pt; margin-left: 15px; margin-bottom: 12px;">
                <tr>
                  <td style="width: 50%; border: none;"><strong>Hardware Required:</strong> ${exp.hardwareRequired || 'None'}</td>
                  <td style="width: 50%; border: none;"><strong>Software Required:</strong> ${exp.softwareRequired || 'None'}</td>
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
              
              ${exp.program1 ? `
                <p style="margin-top: 12px; margin-bottom: 4px;"><strong>PROGRAM 1:</strong></p>
                <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 10px; margin-left: 15px; margin-bottom: 12px;">
                  <pre style="font-family: Consolas, monospace; font-size: 9.5pt; white-space: pre-wrap; margin: 0; border: none; background: transparent; padding: 0;">${exp.program1}</pre>
                </div>
              ` : ''}
              
              ${exp.program2 ? `
                <p style="margin-top: 12px; margin-bottom: 4px;"><strong>PROGRAM 2:</strong></p>
                <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 10px; margin-left: 15px; margin-bottom: 12px;">
                  <pre style="font-family: Consolas, monospace; font-size: 9.5pt; white-space: pre-wrap; margin: 0; border: none; background: transparent; padding: 0;">${exp.program2}</pre>
                </div>
              ` : ''}
              
              ${!exp.program1 && !exp.program2 && exp.program ? `
                <p style="margin-top: 12px; margin-bottom: 4px;"><strong>PROGRAM / CONFIGURATION:</strong></p>
                <div style="background-color: #fafafa; border: 1px solid #ddd; padding: 10px; margin-left: 15px; margin-bottom: 12px;">
                  <pre style="font-family: Consolas, monospace; font-size: 9.5pt; white-space: pre-wrap; margin: 0; border: none; background: transparent; padding: 0;">${exp.program}</pre>
                </div>
              ` : ''}
              
              <p style="margin-top: 12px; margin-bottom: 4px;"><strong>OBSERVATIONS / TABULATION:</strong></p>
              <p style="margin-left: 15px; margin-bottom: 12px; text-align: justify;">${exp.observations || 'N/A'}</p>
              
              <table style="width: 100%; border: none; font-size: 10.5pt; margin-left: 15px; margin-bottom: 12px;">
                <tr>
                  <td style="width: 50%; vertical-align: top; border: none;"><strong>Sample Input:</strong><br/>${exp.sampleInput || 'N/A'}</td>
                  <td style="width: 50%; vertical-align: top; border: none;"><strong>Sample Output:</strong><br/>${exp.sampleOutput || 'N/A'}</td>
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
          <div class="page" style="padding-top: 50px; page-break-before: always;">
            <h2 style="text-align: center; font-size: 16pt; font-weight: bold; text-decoration: underline; margin-bottom: 100px;">LAB COMPLETION SIGN-OFF</h2>
            
            <p style="font-size: 12pt; text-align: justify; line-height: 1.8; margin-bottom: 150px;">
              Certified that the student has successfully completed all the practical exercises prescribed in the syllabus 
              for the course <strong>${editableFields.courseCode} - ${editableFields.courseName}</strong>.
            </p>
            
            <table style="width: 100%; border: none; font-size: 11pt; font-weight: bold;">
              <tr>
                <td style="width: 33%; text-align: left; border: none;">FACULTY IN-CHARGE</td>
                <td style="width: 34%; text-align: center; border: none;">LAB IN-CHARGE</td>
                <td style="width: 33%; text-align: right; border: none;">HEAD OF DEPARTMENT</td>
              </tr>
            </table>
          </div>
        `;

        printWindow.document.write(`
          <html>
            <head>
              <title>${docTitle}</title>
              <style>
                @page { size: A4; margin: 1.5cm 1cm; }
                body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 10px; font-size: 11pt; }
                table { border-collapse: collapse; width: 100%; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 6px; font-size: 10pt; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .page { page-break-after: always; clear: both; }
                pre { font-family: Consolas, monospace; font-size: 9.5pt; border: 1px solid #ccc; padding: 8px; background-color: #fafafa; white-space: pre-wrap; margin-top: 5px; }
                @media print {
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              ${html}
              <script>window.onload = function() { window.print(); };</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        printWindow.close();
        alert("No lab manual data found to export.");
      }
    } else if (activeTab === 'sessionplan') {
      // === HIGH-FIDELITY SESSION PLAN PDF ===
      if (sessionPlanData) {
        let rowsHtml = '';
        sessionPlanData.sessions.forEach((session, idx) => {
          rowsHtml += `
            <tr style="page-break-inside: avoid; background-color: ${idx % 2 === 0 ? '#fff' : '#f9fafb'};">
              <td style="border: 1px solid #d1d5db; text-align: center; padding: 5px; color: #9ca3af; font-size: 9pt;">${idx + 1}</td>
              <td style="border: 1px solid #d1d5db; text-align: center; font-weight: bold; padding: 5px;">${session.period}</td>
              <td style="border: 1px solid #d1d5db; text-align: center; padding: 5px; font-weight: 600; color: #4338ca;">U${session.unit}</td>
              <td style="border: 1px solid #d1d5db; padding: 5px; text-align: left; font-weight: 500;">${session.topic}</td>
              <td style="border: 1px solid #d1d5db; padding: 5px; text-align: left; font-size: 9pt; color: #374151;">${session.learningOutcome || '-'}</td>
              <td style="border: 1px solid #d1d5db; text-align: center; font-weight: bold; padding: 5px; color: #4338ca;">${session.co}</td>
              <td style="border: 1px solid #d1d5db; text-align: center; padding: 5px; font-size: 9pt;">${session.blooms || '-'}</td>
              <td style="border: 1px solid #d1d5db; padding: 5px; text-align: left; font-size: 9pt;">${session.method}</td>
              <td style="border: 1px solid #d1d5db; padding: 5px; text-align: left; font-size: 8.5pt; color: #6b7280;">${session.ref}</td>
            </tr>
          `;
        });

        printWindow.document.write(`
          <html>
            <head>
              <title>${docTitle}</title>
              <style>
                @page { size: A4 landscape; margin: 1.5cm 1cm; }
                body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 0; margin: 0; }
                .header { text-align: center; margin-bottom: 18px; border-bottom: 2px solid #4338ca; padding-bottom: 12px; }
                .college-name { font-size: 15pt; font-weight: bold; margin-bottom: 3px; }
                .college-sub { font-size: 10pt; font-weight: normal; color: #555; }
                .doc-type { font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 8px; color: #1e3a8a; }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #d1d5db; margin-bottom: 16px; font-size: 10pt; }
                .meta-grid .row { display: contents; }
                .meta-grid td { border: 1px solid #d1d5db; padding: 5px 8px; vertical-align: middle; }
                .meta-grid td.label { font-weight: bold; background: #f8fafc; width: 18%; }
                .meta-grid td.total { font-size: 11pt; font-weight: bold; color: #047857; }
                table.sessions { width: 100%; border-collapse: collapse; font-size: 9pt; }
                table.sessions th { background-color: #1e3a8a; color: #fff; font-weight: bold; text-align: center; padding: 6px 5px; border: 1px solid #1e3a8a; }
                table.sessions td { border: 1px solid #d1d5db; padding: 5px; vertical-align: top; }
                .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 10.5pt; font-weight: bold; }
                .sign-line { border-top: 1px solid #555; padding-top: 5px; min-width: 200px; text-align: center; margin-top: 50px; }
                @media print { @page { size: A4 landscape; margin: 1cm; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="college-name">SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
                <div class="college-sub">(An Autonomous Institution, Salem &ndash; 637304)</div>
                <div class="doc-type">SESSION WORK PLAN</div>
              </div>

              <table class="meta-grid" style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10pt;">
                <tbody>
                  <tr>
                    <td class="label">Course Code &amp; Name</td>
                    <td style="font-weight:bold; color:#1e3a8a; border:1px solid #d1d5db; padding:5px 8px;">${subject.code} &ndash; ${subject.name}</td>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Regulation</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">${regulation}</td>
                  </tr>
                  <tr>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Academic Year</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">${sessionPlanData.academicYear || sessionPlanForm.academicYear}</td>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Semester</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">Sem ${semester}</td>
                  </tr>
                  <tr>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Department</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">${department.name || department.id}</td>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Class Duration</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">${sessionPlanData.classDuration || '1 Hour'}</td>
                  </tr>
                  <tr>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Working Weeks</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">${sessionPlanData.workingWeeks} weeks</td>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f8fafc; font-weight:bold;">Classes / Week</td>
                    <td style="border:1px solid #d1d5db; padding:5px 8px;">${sessionPlanData.classesPerWeek}</td>
                  </tr>
                  <tr>
                    <td class="label" style="border:1px solid #d1d5db; padding:5px 8px; background:#f0fdf4; font-weight:bold;">Total Teaching Periods</td>
                    <td colspan="3" class="total" style="border:1px solid #d1d5db; padding:5px 8px; font-size:11pt; font-weight:bold; color:#047857;">${sessionPlanData.totalPeriods} Periods (${sessionPlanData.workingWeeks} weeks &times; ${sessionPlanData.classesPerWeek} classes/week)</td>
                  </tr>
                </tbody>
              </table>

              <table class="sessions">
                <thead>
                  <tr>
                    <th style="width:4%;">S.No</th>
                    <th style="width:5%;">Period</th>
                    <th style="width:5%;">Unit</th>
                    <th style="width:24%;">Topic</th>
                    <th style="width:22%;">Learning Outcome</th>
                    <th style="width:6%;">CO</th>
                    <th style="width:10%;">Bloom's Level</th>
                    <th style="width:14%;">Teaching Method</th>
                    <th style="width:8%;">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <div class="footer">
                <div class="sign-line">Prepared By: Faculty In-charge</div>
                <div class="sign-line">Approved By: Head of Department</div>
              </div>
              <script>window.onload = function() { window.print(); };<\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        printWindow.close();
        alert("No session plan data found to export.");
      }
    } else {
      // === GENERIC PDF for non-CIA tabs ===
      const formattedHtml = renderMarkdownToHtml(content);
      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; color: #1e293b; padding: 2.5rem; line-height: 1.6; }
              .header-container { border-bottom: 2px solid #4f46e5; padding-bottom: 1rem; margin-bottom: 2rem; }
              .header-title { font-size: 24px; font-weight: bold; margin: 0; color: #1e293b; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem; font-size: 14px; color: #64748b; }
              h1, h2, h3 { color: #4f46e5; margin-top: 1.5rem; }
              h1 { font-size: 22px; } h2 { font-size: 18px; } h3 { font-size: 16px; }
              ul { margin-bottom: 1rem; padding-left: 1.5rem; } li { margin-bottom: 0.25rem; }
              @media print { body { padding: 1.5cm; } button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header-container">
              <h1 class="header-title">${tabs.find(t => t.id === activeTab)?.label} - Course Material</h1>
              <div class="meta-grid">
                <div><strong>Subject:</strong> ${subject.code} - ${subject.name}</div>
                <div><strong>Department:</strong> ${department.name} (${department.id})</div>
                <div><strong>Semester:</strong> Sem ${semester}</div>
                <div><strong>Regulation:</strong> ${regulation}</div>
              </div>
            </div>
            <div class="content-body">${formattedHtml}</div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Word (DOC/DOCX) Export utilizing official institution templates from backend
  const handleExportWord = async () => {
    try {
      console.log('Requesting template-driven Word document from backend...');
      const response = await fetch(`${API_BASE_URL}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: activeTab === 'labmanual' ? editableFields.courseCode : subject.code,
          subjectName: activeTab === 'labmanual' ? editableFields.courseName : subject.name,
          departmentId: department.id,
          departmentName: activeTab === 'labmanual' ? editableFields.department : department.name,
          semester: activeTab === 'labmanual' ? editableFields.semester : semester,
          regulation: activeTab === 'labmanual' ? editableFields.regulation : regulation,
          year: activeTab === 'labmanual' ? editableFields.academicYear : year,
          collegeName: activeTab === 'labmanual' ? editableFields.collegeName : undefined,
          facultyName: activeTab === 'labmanual' ? editableFields.facultyName : undefined,
          type: activeTab,
          content: activeTab === 'labmanual' ? JSON.stringify(labManualData) : activeTab === 'sessionplan' ? JSON.stringify(sessionPlanData) : content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate template-driven Word document.');
      }

      // Fetch as binary blob
      const blob = await response.blob();

      // Determine file extension from response headers or default to docx
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${subject.code}_${activeTab.toUpperCase()}_Formatted.docx`;
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Trigger standard browser download of binary file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Template-driven Word document downloaded successfully:', filename);

    } catch (error) {
      console.error('Error exporting template-driven Word document:', error);
      setAlertModal({
        isOpen: true,
        title: 'Download Failed',
        message: 'Failed to download official formatted document. Is the backend running?'
      });
    }
  };

  const handleExportGoogleForm = async () => {
    setIsGeneratingScript(true);
    setShowFormModal(true);
    setIsCopied(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/export-google-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.code,
          subjectName: subject.name,
          content: content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate Google Form script');
      }

      const data = await response.json();
      if (data.success) {
        setAppsScriptCode(data.script);
      } else {
        throw new Error(data.error || 'Failed to generate script');
      }
    } catch (error) {
      console.error("Error generating Google Form script:", error);
      setAppsScriptCode(`// Error: Failed to generate script.\n// Details: ${error.message}\n// Please make sure the backend is running.`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([appsScriptCode], { type: 'text/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${subject.code}_GoogleFormQuiz.gs`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeDirectCreation = async (token) => {
    setDirectFormState({
      status: 'creating',
      message: 'Analyzing AI-generated quiz questions & structures...',
      error: '',
      editUrl: '',
      responderUri: ''
    });

    try {
      const progressMessages = [
        'Creating a new, empty Form on your Google Account...',
        'Converting MCQs to Google Forms compatible schemas...',
        'Injecting Name & Register Number required metadata fields...',
        'Adding 15 structured MCQs with choices and correct answers...',
        'Enabling Quiz Mode, setting 2 points per MCQ, and finalizing...'
      ];

      let messageIndex = 0;
      const intervalId = setInterval(() => {
        if (messageIndex < progressMessages.length) {
          setDirectFormState(prev => {
            if (prev.status === 'creating') {
              return { ...prev, message: progressMessages[messageIndex++] };
            }
            return prev;
          });
        }
      }, 1500);

      const response = await fetch(`${API_BASE_URL}/api/create-google-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: token,
          subjectCode: subject.code,
          subjectName: subject.name,
          content: content
        })
      });

      clearInterval(intervalId);

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to create Google Form directly.');
      }

      setDirectFormState({
        status: 'success',
        message: 'Successfully generated and published your Google Form Quiz!',
        error: '',
        editUrl: data.editUrl,
        responderUri: data.responderUri
      });

      window.open(data.editUrl, '_blank');

    } catch (err) {
      console.error('Execution creation failed:', err);
      setDirectFormState({
        status: 'error',
        message: '',
        error: err.message || 'Failed to complete direct Google Form creation.',
        editUrl: '',
        responderUri: ''
      });
    }
  };

  const handleDirectCreateForm = async () => {
    setDirectFormState({
      status: 'auth',
      message: 'Initializing Google Sign-in connection...',
      error: '',
      editUrl: '',
      responderUri: ''
    });

    try {
      const configRes = await fetch(`${API_BASE_URL}/api/auth/config`);
      const configData = await configRes.json();

      if (!configRes.ok || !configData.success || !configData.googleClientId) {
        throw new Error('Could not retrieve Google Client ID from backend server.');
      }

      const clientId = configData.googleClientId;

      setDirectFormState(prev => ({
        ...prev,
        message: 'Opening Google authorization prompt for Forms & Drive access...'
      }));

      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        throw new Error('Google Identity Services SDK is not loaded. Please refresh the page.');
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google authorization error:', tokenResponse);
            setDirectFormState({
              status: 'error',
              message: '',
              error: `Authorization failed: ${tokenResponse.error_description || tokenResponse.error}`,
              editUrl: '',
              responderUri: ''
            });
            return;
          }

          if (tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            await executeDirectCreation(token);
          } else {
            throw new Error('No access token returned from Google authentication.');
          }
        },
        error_callback: (err) => {
          console.error('GIS Error:', err);
          setDirectFormState({
            status: 'error',
            message: '',
            error: `Google Identity Services error: ${err.message || JSON.stringify(err)}`,
            editUrl: '',
            responderUri: ''
          });
        }
      });

      tokenClient.requestAccessToken();

    } catch (err) {
      console.error('Direct Form Creation error:', err);
      setDirectFormState({
        status: 'error',
        message: '',
        error: err.message || 'An unexpected error occurred during direct Form creation.',
        editUrl: '',
        responderUri: ''
      });
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Top Navigation */}
      <div className="top-nav" style={{ marginBottom: '1.5rem' }}>
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--primary)' }}>{subject.code}</span>
            <span>-</span>
            <span>{subject.name}</span>
            <span className="badge">{regulation}</span>
            {subject.subjectType === 'combined' && (
              subject.isLab
                ? <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>LAB</span>
                : <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>THEORY</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={logoutUser}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div className="course-content-container">

        {/* Sidebar Tabs */}
        <div className="course-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', border: activeTab === tab.id ? 'none' : '' }}
              onClick={() => { setActiveTab(tab.id); setContent(''); }}
            >
              <FileText size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Workspace */}
        <div className="glass-card course-workspace">

          <div className="course-workspace-header">
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tabs.find(t => t.id === activeTab)?.label} Generator</h3>

            <div className="course-action-buttons">
              {(content || (activeTab === 'labmanual' && labManualData) || (activeTab === 'sessionplan' && sessionPlanData)) && (
                <>
                  <div className="download-dropdown-wrapper" ref={downloadDropdownRef}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsDownloadDropdownOpen(prev => !prev)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      aria-haspopup="true"
                      aria-expanded={isDownloadDropdownOpen}
                    >
                      <Download size={15} /> Download <ChevronDown size={14} />
                    </button>
                    
                    {isDownloadDropdownOpen && (
                      <div className="download-dropdown-menu" role="menu">
                        <button
                          className="download-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            handleExportPDF();
                            setIsDownloadDropdownOpen(false);
                          }}
                        >
                          <span>📄</span> Download as PDF
                        </button>
                        <button
                          className="download-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            handleExportWord();
                            setIsDownloadDropdownOpen(false);
                          }}
                        >
                          <span>📝</span> Download as Word
                        </button>
                      </div>
                    )}
                  </div>

                  {activeTab === 'sessionplan' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => { setSessionPlanData(null); setShowSessionPlanForm(true); }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                    >
                      <RefreshCw size={15} /> Re-Generate
                    </button>
                  )}

                  {activeTab === 'quiz' && (
                    <button
                      className="btn"
                      onClick={handleDirectCreateForm}
                      style={{
                        backgroundColor: '#673ab7',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 4px 14px 0 rgba(103, 58, 183, 0.39)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        height: '36px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(103, 58, 183, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(103, 58, 183, 0.39)';
                      }}
                    >
                      <Sparkles size={16} /> Create Google Form
                    </button>
                  )}
                </>
              )}
              {activeTab === 'assignment' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Questions (Max 200):</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    className="input-field"
                    style={{ width: '80px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', textAlign: 'center', backgroundColor: 'white', height: '36px' }}
                    value={assignmentCount}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1));
                      setAssignmentCount(val);
                    }}
                  />
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', height: '44px' }}
              >
                {isGenerating ? <><RefreshCw size={18} className="spinner" style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} /> Generating...</> : <><Sparkles size={18} /> Generate AI Content</>}
              </button>
            </div>
          </div>

          <div className="course-preview-wrapper">
            {!content && !isGenerating ? (
              activeTab === 'labmanual' ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div
                    className="glass-card animate-fade-in"
                    style={{
                      maxWidth: '520px',
                      width: '100%',
                      padding: '3rem 2.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      boxShadow: 'var(--shadow-lg)',
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Lab Manual Generator
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        This Lab Manual will be generated automatically using the built-in college template.
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                        The AI will:
                      </h4>
                      <ul style={{ 
                        listStyle: 'none', 
                        padding: 0, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.85rem',
                        fontSize: '0.925rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>•</span>
                          <span>Read the selected subject syllabus</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>•</span>
                          <span>Extract 10 laboratory experiments</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>•</span>
                          <span>Generate complete experiment content</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>•</span>
                          <span>Populate the official college Lab Manual</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>•</span>
                          <span>Prepare the document for Preview and DOCX Export</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'sessionplan' && showSessionPlanForm ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div
                    className="glass-card animate-fade-in"
                    style={{
                      maxWidth: '520px',
                      width: '100%',
                      padding: '2.5rem 2rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.75)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                      Session Plan Specifications
                    </h3>

                    {formError && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '0.375rem', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                        ⚠️ {formError}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>

                      {/* Academic Year */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Academic Year</label>
                        <select
                          className="input-field"
                          value={sessionPlanForm.academicYear}
                          onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, academicYear: e.target.value })}
                          style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                        >
                          <option value="2024-25">2024-25</option>
                          <option value="2025-26">2025-26</option>
                          <option value="2026-27">2026-27</option>
                        </select>
                      </div>

                      {/* Start & End Dates */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Semester Start Date</label>
                          <input
                            type="date"
                            className="input-field"
                            value={sessionPlanForm.startDate}
                            onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, startDate: e.target.value })}
                            style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Semester End Date</label>
                          <input
                            type="date"
                            className="input-field"
                            value={sessionPlanForm.endDate}
                            onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, endDate: e.target.value })}
                            style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                          />
                        </div>
                      </div>

                      {/* Working Weeks & Classes Per Week */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Total Working Weeks</label>
                          <input
                            type="number"
                            min={1}
                            className="input-field"
                            value={sessionPlanForm.workingWeeks}
                            onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, workingWeeks: parseInt(e.target.value, 10) || 0 })}
                            style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Classes Per Week</label>
                          <input
                            type="number"
                            min={1}
                            max={7}
                            className="input-field"
                            value={sessionPlanForm.classesPerWeek}
                            onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, classesPerWeek: parseInt(e.target.value, 10) || 0 })}
                            style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                          />
                        </div>
                      </div>

                      {/* Duration of Each Class */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Duration of Each Class</label>
                        <select
                          className="input-field"
                          value={sessionPlanForm.classDuration}
                          onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, classDuration: e.target.value })}
                          style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                        >
                          <option value="1 Hour">1 Hour (Default)</option>
                          <option value="50 Minutes">50 Minutes</option>
                          <option value="1.5 Hours">1.5 Hours</option>
                          <option value="2 Hours">2 Hours</option>
                        </select>
                      </div>

                      {/* Teaching Method Preference */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Teaching Method Preference (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Chalk & Talk, PPT, Demos, ICT Tools"
                          className="input-field"
                          value={sessionPlanForm.teachingPreference}
                          onChange={(e) => setSessionPlanForm({ ...sessionPlanForm, teachingPreference: e.target.value })}
                          style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem' }}
                        />
                      </div>

                      {/* Live Calculation Display */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '0.5rem', padding: '0.85rem 1.25rem', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#4f46e5' }}>Total Study Periods:</span>
                        <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '1.25rem' }}>
                          {sessionPlanForm.workingWeeks * sessionPlanForm.classesPerWeek} Periods
                        </span>
                      </div>

                      {/* Form Actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => { setShowSessionPlanForm(false); setFormError(''); }}
                          style={{ width: '100%', height: '44px' }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={handleFormSubmit}
                          style={{ width: '100%', height: '44px', backgroundColor: '#6366f1', borderColor: '#6366f1', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)' }}
                        >
                          <Sparkles size={16} /> Generate Plan
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ) : GENERATOR_CARDS[activeTab] ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div
                    className="glass-card"
                    style={{
                      maxWidth: '420px',
                      width: '100%',
                      textAlign: 'center',
                      padding: '2.5rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1.25rem',
                      transition: 'all 0.3s ease',
                      boxShadow: 'var(--shadow-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.65)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    <div style={{ padding: '0.85rem', backgroundColor: GENERATOR_CARDS[activeTab].bgLight, borderRadius: '50%', color: GENERATOR_CARDS[activeTab].color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={32} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{GENERATOR_CARDS[activeTab].title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        {GENERATOR_CARDS[activeTab].description}
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.7rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: GENERATOR_CARDS[activeTab].color,
                        borderColor: GENERATOR_CARDS[activeTab].color,
                        boxShadow: `0 4px 12px 0 ${GENERATOR_CARDS[activeTab].color}4D`
                      }}
                      onClick={() => activeTab === 'sessionplan' ? setShowSessionPlanForm(true) : handleGenerate()}
                    >
                      <Sparkles size={16} /> {GENERATOR_CARDS[activeTab].buttonText}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.1rem' }}>Click "Generate AI Content" to start creating materials.</p>
                </div>
              )
            ) : isGenerating ? (
              activeTab === 'labmanual' ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div
                    className="glass-card"
                    style={{
                      maxWidth: '520px',
                      width: '100%',
                      padding: '2.5rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      boxShadow: 'var(--shadow-lg)',
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      textAlign: 'left'
                    }}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', textAlign: 'center' }}>
                      Generating Lab Manual
                    </h3>
                    
                    {/* Progress Bar Container */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <span>
                          {labManualProgress && labManualProgress.currentStepIndex >= 3 && labManualProgress.currentStepIndex <= 12
                            ? `Generating Experiment ${labManualProgress.currentStepIndex - 2} of 10...`
                            : labManualProgress?.steps[labManualProgress.currentStepIndex]?.label || 'Initialising...'}
                        </span>
                        <span style={{ color: 'var(--primary)' }}>{labManualProgress?.percent || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${labManualProgress?.percent || 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease-out'
                          }}
                        />
                      </div>
                    </div>

                    {/* Sequential Progress Steps List */}
                    <div style={{ 
                      maxHeight: '280px', 
                      overflowY: 'auto', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.85rem', 
                      padding: '0.75rem',
                      backgroundColor: 'rgba(248, 250, 252, 0.6)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)'
                    }}>
                      {labManualProgress?.steps.map((step, index) => {
                        const isVisible = index <= (labManualProgress.currentStepIndex + 1);
                        if (!isVisible) return null;

                        const isDone = step.status === 'done' || index < labManualProgress.currentStepIndex;
                        const isRunning = step.status === 'running' || index === labManualProgress.currentStepIndex;

                        return (
                          <div
                            key={index}
                            className="animate-slide-up"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              opacity: isDone ? 1 : isRunning ? 0.95 : 0.4,
                              transition: 'all 0.3s ease',
                              padding: '0.25rem 0'
                            }}
                          >
                            {isDone ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', flexShrink: 0 }}>
                                <Check size={12} strokeWidth={4} />
                              </div>
                            ) : isRunning ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #cbd5e1', flexShrink: 0 }} />
                            )}
                            <span style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: isRunning ? 700 : 500, 
                              color: isDone ? 'var(--text-primary)' : isRunning ? '#4f46e5' : 'var(--text-secondary)'
                            }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 500 }}>
                    {activeTab === 'sessionplan'
                      ? 'AI is generating your complete Session Plan from the syllabus...'
                      : 'Gemini AI is generating high-quality curriculum material...'}
                  </p>
                  {activeTab === 'sessionplan' && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>This may take 15–30 seconds. Reading syllabus and mapping periods...</p>
                  )}
                </div>
              )
            ) : sessionPlanData ? (
              <div className="course-content-viewer" style={{ padding: '2rem', backgroundColor: '#f8fafc', overflowY: 'auto' }}>
                <div className="glass-card" style={{ padding: '3rem', minHeight: '800px', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#000', maxWidth: '850px', margin: '0 auto' }}>

                  {/* Title & Metadata */}
                  <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.3 }}>SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY</h1>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b', margin: 0 }}>(An Autonomous Institution, Salem - 637304)</h3>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5', marginTop: '1.5rem', textTransform: 'uppercase', textDecoration: 'underline' }}>SESSION WORK PLAN</h2>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 700, width: '25%' }}>Course Code &amp; Name</td>
                        <td style={{ padding: '0.6rem', color: '#4f46e5', fontWeight: 700, width: '30%' }}>{subject.code} - {subject.name}</td>
                        <td style={{ padding: '0.6rem', fontWeight: 700, width: '20%' }}>Regulation</td>
                        <td style={{ padding: '0.6rem' }}>{regulation}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Academic Year</td>
                        <td style={{ padding: '0.6rem' }}>{sessionPlanData.academicYear || sessionPlanForm.academicYear}</td>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Semester</td>
                        <td style={{ padding: '0.6rem' }}>Sem {semester}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Department</td>
                        <td style={{ padding: '0.6rem' }}>{department.name || department.id || ''}</td>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Class Duration</td>
                        <td style={{ padding: '0.6rem' }}>{sessionPlanData.classDuration || '1 Hour'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Working Weeks</td>
                        <td style={{ padding: '0.6rem' }}>{sessionPlanData.workingWeeks} Weeks</td>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Classes per Week</td>
                        <td style={{ padding: '0.6rem' }}>{sessionPlanData.classesPerWeek} / Week</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f0fdf4' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 700 }}>Total Teaching Periods</td>
                        <td colSpan={3} style={{ padding: '0.6rem', fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                          {sessionPlanData.totalPeriods} Periods ({sessionPlanData.workingWeeks} weeks × {sessionPlanData.classesPerWeek} classes/week)
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Sessions Table Search & Filter Toolbar */}
                  <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Search Input */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input
                          type="text"
                          placeholder="Search topics, outcomes, methods..."
                          value={sessionPlanSearch}
                          onChange={e => setSessionPlanSearch(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc', transition: 'border-color 0.2s' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      {sessionPlanSearch && (
                        <button onClick={() => setSessionPlanSearch('')} style={{ padding: '0.45rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.8rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          ✕ Clear
                        </button>
                      )}
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {(() => {
                          const q = sessionPlanSearch.trim().toLowerCase();
                          const count = q ? sessionPlanData.sessions.filter(s => (s.topic || '').toLowerCase().includes(q) || (s.learningOutcome || '').toLowerCase().includes(q) || (s.method || '').toLowerCase().includes(q) || (s.unit?.toString() || '').includes(q)).length : sessionPlanData.sessions.length;
                          return `${count} of ${sessionPlanData.totalPeriods} periods`;
                        })()}
                      </span>
                    </div>

                    {/* Unit Quick-Filter Badges */}
                    {(() => {
                      const units = [...new Set(sessionPlanData.sessions.map(s => s.unit))].sort((a, b) => a - b);
                      return (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Filter by Unit:</span>
                          {units.map(u => (
                            <button key={u} onClick={() => setSessionPlanSearch(sessionPlanSearch === `unit:${u}` ? '' : `unit:${u}`)}
                              style={{
                                padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
                                backgroundColor: sessionPlanSearch === `unit:${u}` ? '#4f46e5' : `hsl(${220 + (u - 1) * 30}, 70%, 96%)`,
                                color: sessionPlanSearch === `unit:${u}` ? '#fff' : `hsl(${220 + (u - 1) * 30}, 70%, 35%)`,
                                borderColor: sessionPlanSearch === `unit:${u}` ? '#4f46e5' : `hsl(${220 + (u - 1) * 30}, 70%, 80%)`,
                              }}>Unit {u}</button>
                          ))}
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.25rem' }}>
                            ({sessionPlanData.sessions.filter(s => {
                              const q = sessionPlanSearch.trim().toLowerCase();
                              if (!q) return true;
                              if (q.startsWith('unit:')) return s.unit?.toString() === q.split(':')[1];
                              return (s.topic || '').toLowerCase().includes(q) || (s.learningOutcome || '').toLowerCase().includes(q) || (s.method || '').toLowerCase().includes(q);
                            }).length} shown)
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Sessions Table */}
                  <div style={{ overflowX: 'auto' }}>
                    {(() => {
                      const q = sessionPlanSearch.trim().toLowerCase();
                      const isUnitFilter = q.startsWith('unit:');
                      const filteredSessions = sessionPlanData.sessions.filter(s => {
                        if (!q) return true;
                        if (isUnitFilter) return s.unit?.toString() === q.split(':')[1];
                        return (s.topic || '').toLowerCase().includes(q) || (s.learningOutcome || '').toLowerCase().includes(q) || (s.method || '').toLowerCase().includes(q) || (s.co || '').toLowerCase().includes(q) || (s.blooms || '').toLowerCase().includes(q);
                      });
                      return (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#4f46e5', color: '#fff', fontWeight: 700, borderTop: '2px solid #4338ca', borderBottom: '2px solid #4338ca' }}>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'center', width: '4%' }}>S.No</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'center', width: '5%' }}>Period</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'center', width: '5%' }}>Unit</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'left', width: '26%' }}>Topic</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'left', width: '20%' }}>Learning Outcome</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'center', width: '6%' }}>CO</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'center', width: '10%' }}>Bloom's Level</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'left', width: '14%' }}>Teaching Method</th>
                              <th style={{ padding: '0.55rem 0.4rem', border: '1px solid #6366f1', textAlign: 'left', width: '8%' }}>Ref</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSessions.length === 0 ? (
                              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px solid #cbd5e1' }}>No sessions match your search. Try a different keyword.</td></tr>
                            ) : filteredSessions.map((session, idx) => {
                              const isMatch = q && !isUnitFilter && ((session.topic || '').toLowerCase().includes(q) || (session.learningOutcome || '').toLowerCase().includes(q) || (session.method || '').toLowerCase().includes(q));
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isMatch ? '#fefce8' : idx % 2 === 0 ? '#fff' : '#f8fafc', outline: isMatch ? '2px solid #fbbf24' : 'none', outlineOffset: '-1px' }}>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>{idx + 1}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{session.period}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600, color: '#4f46e5', backgroundColor: `hsl(${220 + (session.unit - 1) * 30}, 70%, 97%)` }}>U{session.unit}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', fontWeight: 500, color: '#1e293b' }}>{session.topic}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', color: '#475569', fontSize: '0.77rem' }}>{session.learningOutcome || '-'}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: '#4f46e5' }}>{session.co}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.72rem', fontWeight: 700,
                                      backgroundColor: session.blooms?.startsWith('K1') ? '#fef3c7' : session.blooms?.startsWith('K2') ? '#dbeafe' : session.blooms?.startsWith('K3') ? '#dcfce7' : session.blooms?.startsWith('K4') ? '#fce7f3' : session.blooms?.startsWith('K5') ? '#ede9fe' : '#fef9c3',
                                      color: session.blooms?.startsWith('K1') ? '#92400e' : session.blooms?.startsWith('K2') ? '#1d4ed8' : session.blooms?.startsWith('K3') ? '#166534' : session.blooms?.startsWith('K4') ? '#9d174d' : session.blooms?.startsWith('K5') ? '#5b21b6' : '#713f12'
                                    }}>{session.blooms || '-'}</span>
                                  </td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', color: '#475569' }}>{session.method}</td>
                                  <td style={{ padding: '0.45rem', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.75rem' }}>{session.ref}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', marginTop: '3rem', minWidth: '180px' }}>Prepared By: Faculty In-charge</div>
</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', marginTop: '3rem', minWidth: '180px' }}>Approved By: Head of Department</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : labManualData ? (
              showLabManualPreview ? (
                <div className="course-content-viewer" style={{ display: 'flex', gap: '2rem', padding: '1rem', backgroundColor: '#f1f5f9', flexWrap: 'wrap' }}>

                  {/* 1. Sidebar Edit Panel */}
                  <div className="glass-card" style={{
                    width: '320px',
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    position: 'sticky',
                    top: '1.5rem',
                    alignSelf: 'flex-start',
                    flexShrink: 0
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', margin: 0, color: '#1e293b' }}>
                      Edit Cover Details
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>COLLEGE NAME</label>
                        <textarea
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', resize: 'vertical' }}
                          rows={2}
                          value={editableFields.collegeName}
                          onChange={(e) => setEditableFields({ ...editableFields, collegeName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>DEPARTMENT</label>
                        <input
                          type="text"
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                          value={editableFields.department}
                          onChange={(e) => setEditableFields({ ...editableFields, department: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>REGULATION</label>
                          <input
                            type="text"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                            value={editableFields.regulation}
                            onChange={(e) => setEditableFields({ ...editableFields, regulation: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>ACADEMIC YEAR</label>
                          <input
                            type="text"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                            value={editableFields.academicYear}
                            onChange={(e) => setEditableFields({ ...editableFields, academicYear: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>SEMESTER</label>
                          <input
                            type="text"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                            value={editableFields.semester}
                            onChange={(e) => setEditableFields({ ...editableFields, semester: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>COURSE CODE</label>
                          <input
                            type="text"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                            value={editableFields.courseCode}
                            onChange={(e) => setEditableFields({ ...editableFields, courseCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>COURSE NAME</label>
                        <input
                          type="text"
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                          value={editableFields.courseName}
                          onChange={(e) => setEditableFields({ ...editableFields, courseName: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>FACULTY IN-CHARGE</label>
                        <input
                          type="text"
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                          value={editableFields.facultyName}
                          onChange={(e) => setEditableFields({ ...editableFields, facultyName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                      Changes synchronize in real-time with print views and Word exports.
                    </div>
                  </div>

                  {/* 2. Main Scrollable Preview Container */}
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    {(() => {
                      const displayDept = editableFields.department || 'Computer Science and Engineering';
                      const deptVM = getDeptVM(displayDept);
                      const displayYear = editableFields.academicYear;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>

                          {/* 1. Cover Page */}
                          <div className="glass-card" style={{ padding: '3rem', minHeight: '800px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '2px solid #ea580c', color: '#000', textAlign: 'center' }}>
                            <div>
                              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.3 }}>{editableFields.collegeName.toUpperCase()}</h1>
                              <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b', margin: 0 }}>(An Autonomous Institution)</h3>
                              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</p>

                              <div style={{ margin: '2.5rem 0' }}>
                                <img src="/logo.png" style={{ width: '85px', height: 'auto', margin: '0 auto' }} alt="Logo" onError={(e) => e.target.style.display = 'none'} />
                              </div>

                              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DEPARTMENT OF {displayDept.toUpperCase()}</h2>

                              <div style={{ border: '2px solid #ea580c', padding: '8px 24px', display: 'inline-block', margin: '1.5rem auto', fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                RECORD NOTEBOOK
                              </div>
                            </div>

                            <div style={{ margin: '1.5rem 0' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <tbody>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.65rem', fontWeight: 700, width: '40%', textAlign: 'left' }}>Course Code</td><td style={{ padding: '0.65rem', color: '#ea580c', fontWeight: 700, textAlign: 'left' }}>{editableFields.courseCode}</td></tr>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.65rem', fontWeight: 700, textAlign: 'left' }}>Course Name</td><td style={{ padding: '0.65rem', fontWeight: 700, textAlign: 'left' }}>{editableFields.courseName}</td></tr>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.65rem', fontWeight: 700, textAlign: 'left' }}>Regulation</td><td style={{ padding: '0.65rem', textAlign: 'left' }}>{formatRegulation(editableFields.regulation)}</td></tr>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.65rem', fontWeight: 700, textAlign: 'left' }}>Academic Year</td><td style={{ padding: '0.65rem', textAlign: 'left' }}>{displayYear}</td></tr>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.65rem', fontWeight: 700, textAlign: 'left' }}>Semester</td><td style={{ padding: '0.65rem', textAlign: 'left' }}>Sem {editableFields.semester}</td></tr>
                                </tbody>
                              </table>
                            </div>

                            <div style={{ border: '2px solid #ea580c', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', textAlign: 'left' }}>
                              <div style={{ marginBottom: '0.85rem', display: 'flex', gap: '1rem' }}><span style={{ fontWeight: 700, width: '140px' }}>NAME:</span><span style={{ borderBottom: '1px solid #cbd5e1', flex: 1 }}></span></div>
                              <div style={{ marginBottom: '0.85rem', display: 'flex', gap: '1rem' }}><span style={{ fontWeight: 700, width: '140px' }}>REGISTER NO:</span><span style={{ borderBottom: '1px solid #cbd5e1', flex: 1 }}></span></div>
                              <div style={{ marginBottom: '0.85rem', display: 'flex', gap: '1rem' }}><span style={{ fontWeight: 700, width: '140px' }}>BRANCH / YEAR:</span><span style={{ borderBottom: '1px solid #cbd5e1', flex: 1, color: '#334155' }}>{displayDept} / {editableFields.academicYear.split('-')[0] || ''}</span></div>
                              <div style={{ display: 'flex', gap: '1rem' }}><span style={{ fontWeight: 700, width: '140px' }}>SEMESTER:</span><span style={{ borderBottom: '1px solid #cbd5e1', flex: 1, color: '#334155' }}>{editableFields.semester}</span></div>
                            </div>
                          </div>

                          {/* 2. Certificate Page */}
                          <div className="glass-card" style={{ padding: '3rem', minHeight: '800px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '2px solid #ea580c', color: '#000', textAlign: 'center' }}>
                            <div>
                              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>{editableFields.collegeName.toUpperCase()}</h1>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b', margin: 0 }}>(An Autonomous Institution)</h3>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Pullipalayam, Morur (Po.), Sankari (Tk.), Salem (Dt.) - 637 304.</p>

                              <div style={{ margin: '1.5rem 0' }}>
                                <img src="/logo.png" style={{ width: '80px', height: 'auto', margin: '0 auto' }} alt="Logo" onError={(e) => e.target.style.display = 'none'} />
                              </div>

                              <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, textDecoration: 'underline', marginBottom: '1.5rem', color: '#1e293b' }}>RECORD NOTEBOOK</h2>
                              <div style={{ fontSize: '0.95rem', textAlign: 'left', width: '85%', margin: '0 auto 1.5rem auto', fontWeight: 700 }}>REGISTER NUMBER: .......................................</div>

                              <p style={{ fontSize: '1rem', textAlign: 'justify', lineHeight: '2.2', color: '#334155', width: '85%', margin: '0 auto' }}>
                                Certified that this is a bonafide record of Practical work done by Mr./Ms. ____________________________________________________ of the <strong>{editableFields.semester} Semester</strong> in the <strong>{editableFields.courseCode} - {editableFields.courseName}</strong> Laboratory in the Department of <strong>{displayDept}</strong> during the academic year <strong>{displayYear}</strong>.
                              </p>
                            </div>

                            <div>
                              <table style={{ width: '85%', border: 'none', margin: '3rem auto 1rem auto', fontSize: '0.9rem', fontWeight: 700 }}>
                                <tbody>
                                  <tr>
                                    <td style={{ border: 'none', textAlign: 'center', padding: '2rem 0 0 0' }}>Signature of Staff In-charge</td>
                                    <td style={{ border: 'none', textAlign: 'center', padding: '2rem 0 0 0' }}>Signature of Head of Department</td>
                                  </tr>
                                </tbody>
                              </table>

                              <p style={{ fontSize: '0.9rem', marginTop: '3rem', color: '#334155', textAlign: 'left', width: '85%', margin: '3rem auto 0 auto' }}>
                                Submitted for the Autonomous End Semester Practical Examination held on ______________________.
                              </p>

                              <table style={{ width: '85%', border: 'none', margin: '2rem auto 0 auto', fontSize: '0.9rem', fontWeight: 700 }}>
                                <tbody>
                                  <tr>
                                    <td style={{ border: 'none', textAlign: 'center' }}>INTERNAL EXAMINER</td>
                                    <td style={{ border: 'none', textAlign: 'center' }}>EXTERNAL EXAMINER</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* 3. Vision & Mission */}
                          <div className="glass-card" style={{ padding: '3rem', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#000' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '1rem', textTransform: 'uppercase', color: '#1e293b' }}>VISION OF THE INSTITUTE</h2>
                            <p style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '1rem', color: '#334155', marginTop: '0.75rem' }}>To be an institute of repute in the field of engineering and technology by implementing the best educational practices akin to global standards for fostering domain knowledge and developing research attitude among students to make them globally competent.</p>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2rem', textTransform: 'uppercase', color: '#1e293b' }}>MISSION OF THE INSTITUTE</h2>
                            <ul style={{ lineHeight: '1.6', fontSize: '1rem', color: '#334155', paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
                              <li style={{ marginBottom: '0.35rem' }}>Achieving excellence in Teaching Learning process using state-of-the-art resources.</li>
                              <li style={{ marginBottom: '0.35rem' }}>Extending opportunity to upgrade faculty knowledge and skills.</li>
                              <li style={{ marginBottom: '0.35rem' }}>Implementing the best student training practices for requirements of industrial scenario of the state.</li>
                              <li>Motivating faculty and students in research activity for real time application.</li>
                            </ul>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2.5rem', textTransform: 'uppercase', color: '#1e293b' }}>VISION OF THE DEPARTMENT</h2>
                            <p style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '1rem', color: '#334155', marginTop: '0.75rem' }}>{deptVM.vision}</p>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2rem', textTransform: 'uppercase', color: '#1e293b' }}>MISSION OF THE DEPARTMENT</h2>
                            <ul style={{ lineHeight: '1.6', fontSize: '1rem', color: '#334155', paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
                              {deptVM.mission.map((m, idx) => <li key={idx} style={{ marginBottom: '0.35rem' }}>{m}</li>)}
                            </ul>
                          </div>

                          {/* 4. PEO, PO & PSO */}
                          <div className="glass-card" style={{ padding: '3rem', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#000' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', textTransform: 'uppercase', color: '#1e293b' }}>PROGRAM EDUCATIONAL OBJECTIVES (PEOs)</h2>
                            <ul style={{ lineHeight: '1.6', fontSize: '1rem', color: '#334155', paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
                              <li style={{ marginBottom: '0.5rem' }}><strong>PEO 1:</strong> Graduates will be able to demonstrate their technical skills and competency in various applications by providing creative and novel technological solutions.</li>
                              <li style={{ marginBottom: '0.5rem' }}><strong>PEO 2:</strong> Graduates will be able to ensure the effective contribution to the society through critical thinking, innovations and research with the broad spectrum of skills in frontline technologies.</li>
                              <li><strong>PEO 3:</strong> Graduates will be equipped with multidisciplinary initiatives and visions towards the growth of society with respect to ethical and lifelong learning.</li>
                            </ul>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2rem', textTransform: 'uppercase', color: '#1e293b' }}>PROGRAM SPECIFIC OUTCOMES (PSOs)</h2>
                            <ul style={{ lineHeight: '1.6', fontSize: '1rem', color: '#334155', paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
                              {deptVM.psos.map((pso, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5rem' }}><strong>PSO {idx + 1}:</strong> {pso}</li>
                              ))}
                            </ul>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2rem', textTransform: 'uppercase', color: '#1e293b' }}>PROGRAM OUTCOMES (POs)</h2>
                            <ol style={{ lineHeight: '1.4', fontSize: '0.85rem', color: '#475569', paddingLeft: '1.15rem', marginTop: '0.75rem' }}>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Engineering knowledge:</strong> Apply the knowledge of mathematics, science, engineering fundamentals, and specialization to engineering problems.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Problem analysis:</strong> Identify, formulate, and analyze complex engineering problems.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Design/development of solutions:</strong> Design solutions for complex engineering problems.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Conduct investigations of complex problems:</strong> Use research-based knowledge and methods to provide valid conclusions.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Modern tool usage:</strong> Apply appropriate techniques, resources, and modern engineering and IT tools.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>The engineer and society:</strong> Assess societal, health, safety, legal, and cultural issues.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Environment and sustainability:</strong> Understand the impact of professional engineering solutions.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Ethics:</strong> Apply ethical principles and commit to professional ethics.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Individual and team work:</strong> Function effectively as an individual or member/leader in diverse teams.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Communication:</strong> Communicate effectively with the engineering community and society.</li>
                              <li style={{ marginBottom: '0.25rem' }}><strong>Project management and finance:</strong> Demonstrate knowledge of engineering and management principles.</li>
                              <li><strong>Life-long learning:</strong> Recognize the need for, and have the preparation to engage in independent learning.</li>
                            </ol>
                          </div>

                          {/* 5. Course Objectives, Outcomes & Mapping */}
                          <div className="glass-card" style={{ padding: '3rem', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#000' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', textTransform: 'uppercase', color: '#1e293b' }}>COURSE OBJECTIVES</h2>
                            <ol style={{ lineHeight: '1.6', fontSize: '1rem', color: '#334155', paddingLeft: '1.25rem', marginTop: '0.75rem' }}>
                              {(labManualData.courseObjectives || []).map((obj, idx) => <li key={idx} style={{ marginBottom: '0.35rem' }}>{obj}</li>)}
                            </ol>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2rem', textTransform: 'uppercase', color: '#1e293b' }}>COURSE OUTCOMES (COs)</h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '15%', textAlign: 'center' }}>CO No.</th>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '65%', textAlign: 'left' }}>Course Outcome Description</th>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '20%', textAlign: 'center' }}>Bloom's Level</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(labManualData.courseOutcomes || []).map((co, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>{co.co}</td>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>{co.description}</td>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.85rem' }}>{co.bloomsLevel}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', marginTop: '2.5rem', textTransform: 'uppercase', color: '#1e293b' }}>CO - PO / PSO MAPPING MATRIX</h2>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', width: '8%', textAlign: 'center' }}>COs</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO1</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO2</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO3</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO4</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO5</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO6</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO7</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO8</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO9</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO10</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO11</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>PO12</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center', backgroundColor: '#ecfdf5' }}>PSO1</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center', backgroundColor: '#ecfdf5' }}>PSO2</th>
                                    <th style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center', backgroundColor: '#ecfdf5' }}>PSO3</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(labManualData.coPoMapping || []).map((mapRow, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>{mapRow.co}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po1 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po2 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po3 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po4 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po5 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po6 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po7 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po8 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po9 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po10 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po11 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{mapRow.po12 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center', backgroundColor: '#f0fdf4', fontWeight: 600 }}>{mapRow.pso1 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center', backgroundColor: '#f0fdf4', fontWeight: 600 }}>{mapRow.pso2 || '-'}</td>
                                      <td style={{ padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center', backgroundColor: '#f0fdf4', fontWeight: 600 }}>{mapRow.pso3 || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* 6. List of Experiments */}
                          <div className="glass-card" style={{ padding: '3rem', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#000' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '2px solid #ea580c', paddingBottom: '0.4rem', textTransform: 'uppercase', color: '#1e293b' }}>LIST OF EXPERIMENTS</h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f1f5f9' }}>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '10%', textAlign: 'center' }}>S.No.</th>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '60%', textAlign: 'left' }}>Experiment Title</th>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '15%', textAlign: 'center' }}>Mapped CO</th>
                                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', width: '15%', textAlign: 'center' }}>Bloom's Level</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(labManualData.experiments || []).map((exp, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'center' }}>{exp.experimentNo || exp.no || (idx + 1)}</td>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>{exp.title}</td>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{exp.coMapping}</td>
                                    <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>{exp.bloomsTaxonomy || exp.bloomsLevel}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* 7. Detailed Experiments */}
                          {(labManualData.experiments || []).map((exp, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '3.5rem 3rem', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#000', position: 'relative' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                <span>EX. NO: {exp.experimentNo || exp.no || (idx + 1)}</span>
                                <span>DATE: __________________</span>
                              </div>

                              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', textDecoration: 'underline', color: '#1e293b', marginBottom: '2rem' }}>{exp.title}</h2>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                <div>
                                  <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>AIM:</strong>
                                  <p style={{ margin: 0, paddingLeft: '0.5rem', textAlign: 'justify' }}>{exp.aim}</p>
                                </div>

                                <div>
                                  <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>OBJECTIVES:</strong>
                                  <p style={{ margin: 0, paddingLeft: '0.5rem', textAlign: 'justify' }}>{exp.objectives || 'None'}</p>
                                </div>

                                <div>
                                  <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>THEORY:</strong>
                                  <p style={{ margin: 0, paddingLeft: '0.5rem', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>{exp.theory}</p>
                                </div>

                                {(exp.requirements || exp.hardwareRequired || exp.softwareRequired) && (
                                  <div>
                                    <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>REQUIREMENTS:</strong>
                                    <p style={{ margin: 0, paddingLeft: '0.5rem', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>{exp.requirements || [exp.softwareRequired, exp.hardwareRequired].filter(Boolean).join('\n')}</p>
                                  </div>
                                )}

                                <div>
                                  <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>PROCEDURE:</strong>
                                  {Array.isArray(exp.procedure)
                                    ? <ol style={{ margin: 0, paddingLeft: '1.5rem', textAlign: 'justify' }}>{exp.procedure.map((step, si) => <li key={si}>{step}</li>)}</ol>
                                    : <p style={{ margin: 0, paddingLeft: '0.5rem', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>{exp.procedure}</p>
                                  }
                                </div>

                                {(exp.program || exp.program1) && (
                                  <div>
                                    <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.4rem' }}>PROGRAM:</strong>
                                    <div style={{ backgroundColor: '#2d3748', color: '#f7fafc', padding: '1rem', borderRadius: '0.375rem', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.85rem', overflowX: 'auto', whiteSpace: 'pre' }}>
                                      {exp.program || exp.program1}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <strong style={{ color: '#ea580c', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>OBSERVATIONS / TABULATION:</strong>
                                  <p style={{ margin: 0, paddingLeft: '0.5rem', textAlign: 'justify' }}>{exp.observations || 'N/A'}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                  <div>
                                    <strong style={{ fontSize: '0.9rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Sample Input:</strong>
                                    <pre style={{ margin: 0, padding: '0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{exp.sampleInput || 'N/A'}</pre>
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '0.9rem', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Sample Output:</strong>
                                    <pre style={{ margin: 0, padding: '0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{exp.sampleOutput || 'N/A'}</pre>
                                  </div>
                                </div>

                                <div style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '0.85rem', borderRadius: '0 0.5rem 0.5rem 0' }}>
                                  <strong style={{ color: '#047857', display: 'block', fontSize: '0.95rem', marginBottom: '0.15rem' }}>RESULT:</strong>
                                  <p style={{ margin: 0, fontWeight: 700, color: '#065f46' }}>{exp.result}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                                  <div>
                                    <strong style={{ color: '#ea580c', display: 'block', fontSize: '0.95rem' }}>APPLICATIONS:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{exp.applications || 'None'}</p>
                                  </div>
                                  <div>
                                    <strong style={{ color: '#ea580c', display: 'block', fontSize: '0.95rem' }}>PRECAUTIONS:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{exp.precautions || 'None'}</p>
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                                  <div>
                                    <strong style={{ color: '#ea580c', display: 'block', fontSize: '0.95rem' }}>LEARNING OUTCOME:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{exp.learningOutcome || 'None'}</p>
                                  </div>
                                  <div>
                                    <strong style={{ color: '#ea580c', display: 'block', fontSize: '0.95rem' }}>REFERENCES:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>{exp.references || 'None'}</p>
                                  </div>
                                </div>

                                {exp.vivaQuestions && exp.vivaQuestions.length > 0 && (
                                  <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                    <strong style={{ color: '#1e293b', display: 'block', fontSize: '1.1rem', marginBottom: '0.75rem', textDecoration: 'underline' }}>VIVA VOCE QUESTIONS &amp; ANSWERS:</strong>
                                    <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                      {exp.vivaQuestions.map((q, qIdx) => (
                                        <li key={qIdx}>
                                          <div style={{ fontWeight: 700, color: '#334155' }}>Q: {q.question}</div>
                                          <div style={{ color: '#475569', marginTop: '0.15rem' }}>A: {q.answer}</div>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* 8. Signature Page */}
                          <div className="glass-card" style={{ padding: '3rem', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '0.75rem', border: '2px solid #ea580c', color: '#000' }}>
                            <div>
                              <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, textDecoration: 'underline', marginBottom: '3rem', color: '#1e293b' }}>LAB COMPLETION SIGN-OFF</h2>
                              <p style={{ fontSize: '1.1rem', textAlign: 'justify', lineHeight: '1.8', color: '#334155' }}>
                                Certified that the student has successfully completed all the practical exercises prescribed in the syllabus for the course <strong>{editableFields.courseCode} - {editableFields.courseName}</strong>.
                              </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6rem', fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>
                              <span>FACULTY IN-CHARGE</span>
                              <span>LAB IN-CHARGE</span>
                              <span>HEAD OF DEPARTMENT</span>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <div
                    className="glass-card animate-fade-in"
                    style={{
                      maxWidth: '480px',
                      width: '100%',
                      padding: '3rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      boxShadow: 'var(--shadow-lg)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      textAlign: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', animation: 'bounce 1s ease infinite' }}>🎉</div>
                    
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Lab Manual Generated Successfully
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      The AI generated all experiments and successfully applied the college template format.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', textAlign: 'left', backgroundColor: 'rgba(240, 253, 250, 0.8)', border: '1px solid #ccfbf1', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f766e', fontWeight: 600, fontSize: '0.95rem' }}>
                        <Check size={16} strokeWidth={3} style={{ color: '#10b981' }} />
                        <span>10 Experiments Generated</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f766e', fontWeight: 600, fontSize: '0.95rem' }}>
                        <Check size={16} strokeWidth={3} style={{ color: '#10b981' }} />
                        <span>College Template Applied</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f766e', fontWeight: 600, fontSize: '0.95rem' }}>
                        <Check size={16} strokeWidth={3} style={{ color: '#10b981' }} />
                        <span>DOCX Ready</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                      <button
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '0.85rem 1.5rem',
                          fontSize: '1rem',
                          fontWeight: 600,
                          backgroundColor: '#4f46e5',
                          borderColor: '#4f46e5',
                          borderRadius: 'var(--radius-sm)'
                        }}
                        onClick={() => setShowLabManualPreview(true)}
                      >
                        Preview
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{
                          flex: 1,
                          padding: '0.85rem 1.5rem',
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)'
                        }}
                        onClick={handleExportWord}
                      >
                        Export DOCX
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="course-content-viewer">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Google Forms Apps Script Modal */}
      {showFormModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            padding: '2rem', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5' }}>
                <Sparkles size={24} /> Create Google Form Quiz
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => setShowFormModal(false)}>
                ✕ Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>

              {/* Step-by-Step Instructions */}
              <div style={{ padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                <h4 style={{ fontWeight: 600, color: '#4f46e5', marginBottom: '0.75rem' }}>How to create your Google Form instantly:</h4>
                <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>
                  <li>Click <strong>Copy Code</strong> below to copy the automation script to your clipboard.</li>
                  <li>Open <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Google Apps Script <ExternalLink size={12} /></a> (or go to Google Drive &gt; New &gt; More &gt; Google Apps Script).</li>
                  <li>Delete any existing template code in the editor, and <strong>paste</strong> the copied code.</li>
                  <li>Click the <strong>Save</strong> (disk) icon, then click the <strong>Run</strong> (triangle) button at the top.</li>
                  <li>Click "Review Permissions" to authorize the script (it is completely secure and runs solely on your own Google Account).</li>
                  <li>The quiz will be created in your Google Drive! The direct links will be printed in the <strong>Execution Log</strong> at the bottom of the editor.</li>
                </ol>
              </div>

              {/* Code Editor Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderTopLeftRadius: 'var(--radius-sm)', borderTopRightRadius: 'var(--radius-sm)', padding: '0.5rem 1rem', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    <FileCode size={14} /> {subject.code}_google_form.gs
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" disabled={isGeneratingScript} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#334155', color: '#f8fafc', border: 'none' }} onClick={handleCopyCode}>
                      {isCopied ? <><Check size={12} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={12} /> Copy Code</>}
                    </button>
                    <button className="btn" disabled={isGeneratingScript} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#334155', color: '#f8fafc', border: 'none' }} onClick={handleDownloadScript}>
                      <Download size={12} /> Download .gs
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, backgroundColor: '#0f172a', borderBottomLeftRadius: 'var(--radius-sm)', borderBottomRightRadius: 'var(--radius-sm)', padding: '1rem', overflow: 'hidden', display: 'flex' }}>
                  {isGeneratingScript ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <RefreshCw size={32} className="spinner" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.5rem' }} />
                      <span>Parsing questions and composing automation script...</span>
                    </div>
                  ) : (
                    <pre style={{ flex: 1, overflow: 'auto', margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8', whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.4' }}>
                      {appsScriptCode}
                    </pre>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Direct Google Forms Status/Success Modal */}
      {directFormState.status !== 'idle' && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050,
          animation: 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* CSS Animation Keyframes for the Premium Modal */}
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes progress-bar {
              0% { left: -30%; width: 30%; }
              50% { left: 30%; width: 40%; }
              100% { left: 100%; width: 30%; }
            }
            @keyframes scale-up {
              0% { transform: scale(0.7); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 0.8; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-6px); }
              40%, 80% { transform: translateX(6px); }
            }
          `}} />
          <div className="glass-card" style={{
            width: '550px',
            padding: '2.5rem',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 25px 50px -12px rgba(103, 58, 183, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)'
          }}>

            {/* 1. AUTHENTICATING / CREATING (Loading State) */}
            {(directFormState.status === 'auth' || directFormState.status === 'creating') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: '50%', border: '4px solid rgba(103, 58, 183, 0.1)',
                    borderTopColor: '#673ab7',
                    animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
                  }} />
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px',
                    borderRadius: '50%', border: '4px solid rgba(103, 58, 183, 0.05)',
                    borderBottomColor: '#ab47bc',
                    animation: 'spin 0.8s linear infinite reverse'
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#673ab7'
                  }}>
                    <Sparkles size={28} className="pulse" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>
                  Creating Google Form Quiz
                </h3>

                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  minHeight: '48px',
                  lineHeight: '1.5',
                  padding: '0 1rem',
                  transition: 'opacity 0.3s ease'
                }}>
                  {directFormState.message}
                </p>

                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(103, 58, 183, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    height: '100%',
                    backgroundColor: '#673ab7',
                    borderRadius: '3px',
                    width: '60%',
                    left: 0,
                    animation: 'progress-bar 2.5s ease-in-out infinite'
                  }} />
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This will launch your browser auth popup if not already verified.
                </span>
              </div>
            )}

            {/* 2. SUCCESS STATE */}
            {directFormState.status === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                <div style={{
                  width: '72px', height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#10b981',
                  animation: 'scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                  <Check size={38} strokeWidth={3} />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                  Quiz Ready & Published!
                </h3>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', padding: '0 0.5rem', lineHeight: '1.5' }}>
                  The Google Form has been directly built inside your Google Drive.
                  It includes the complete MCQ questions and answer key automatically graded!
                </p>

                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  marginBottom: '1rem'
                }}>
                  <a
                    href={directFormState.editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      backgroundColor: '#673ab7',
                      boxShadow: '0 4px 14px 0 rgba(103, 58, 183, 0.39)',
                      width: '100%',
                      textDecoration: 'none'
                    }}
                  >
                    Open in Google Forms <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                  </a>

                  <a
                    href={directFormState.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ width: '100%', textDecoration: 'none' }}
                  >
                    View Student Live Link <ExternalLink size={16} style={{ marginLeft: '4px' }} />
                  </a>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    color: 'var(--text-secondary)'
                  }}
                  onClick={() => setDirectFormState({ status: 'idle', message: '', error: '', editUrl: '', responderUri: '' })}
                >
                  ✕ Close & Return
                </button>
              </div>
            )}

            {/* 3. ERROR STATE */}
            {directFormState.status === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                <div style={{
                  width: '72px', height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444',
                  animation: 'shake 0.5s ease'
                }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 'bold', fontFamily: 'inherit' }}>!</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                  Creation Failed
                </h3>

                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  color: '#dc2626',
                  fontFamily: 'monospace',
                  width: '100%',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap'
                }}>
                  {directFormState.error}
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, backgroundColor: '#673ab7', border: 'none' }}
                    onClick={handleDirectCreateForm}
                  >
                    <RefreshCw size={16} /> Try Again
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setDirectFormState({ status: 'idle', message: '', error: '', editUrl: '', responderUri: '' })}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* Premium Alert Modal */}
      {alertModal.isOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '450px',
            padding: '2.5rem',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {alertModal.title}
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              {alertModal.message}
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CourseContent;
