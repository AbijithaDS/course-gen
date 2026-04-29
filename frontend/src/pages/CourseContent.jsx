import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Settings, Sparkles, Download, Edit3, Save, RefreshCw, FileText, Info } from 'lucide-react';

const STATIC_TABS = [
  { id: 'vision', label: 'Vision' },
  { id: 'mission', label: 'Mission' },
  { id: 'po', label: 'Program Outcomes (PO)' },
  { id: 'pso', label: 'Program Specific Outcomes (PSO)' },
  { id: 'peo', label: 'Program Educational Objectives (PEO)' },
  { id: 'course_file', label: 'Course File' },
  { id: 'syllabus', label: 'Subject Syllabus' }
];

const AI_TABS = [
  { id: 'cia1', label: 'CIA 1' },
  { id: 'cia2', label: 'CIA 2' },
  { id: 'qbank', label: 'Question Bank' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'hots', label: 'HOTS' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'beyond', label: 'Beyond Syllabus' }
];

const STATIC_CONTENT = {
  vision: "To be a center of excellence in education and research, producing globally competent professionals with strong ethical values.",
  mission: "1. To provide quality education through innovative teaching-learning processes.\n2. To foster research and development in cutting-edge technologies.\n3. To instill social responsibility and ethical values in students.",
  po: "1. Engineering knowledge\n2. Problem analysis\n3. Design/development of solutions\n4. Conduct investigations of complex problems\n5. Modern tool usage\n6. The engineer and society\n7. Environment and sustainability\n8. Ethics\n9. Individual and team work\n10. Communication\n11. Project management and finance\n12. Life-long learning",
  pso: "1. Apply mathematical foundations and algorithmic principles to solve real-world problems.\n2. Design and develop software systems of varying complexity.",
  peo: "1. Graduates will have successful careers in industry or academia.\n2. Graduates will demonstrate leadership and teamwork skills.\n3. Graduates will engage in continuous professional development.",
  course_file: "Course File Index:\n1. Syllabus\n2. Lesson Plan\n3. CIA Question Papers\n4. Assignment Topics\n5. Quiz Questions\n6. Sample Answer Sheets\n7. Result Analysis",
  syllabus: "Unit 1: Introduction to the Subject\nUnit 2: Core Concepts and Principles\nUnit 3: Advanced Topics\nUnit 4: Applications and Case Studies\nUnit 5: Future Trends and Research"
};

const CourseContent = () => {
  const navigate = useNavigate();
  const { department, semester, subject } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('cia1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // If it's a static tab, load static content immediately
    if (STATIC_CONTENT[activeTab]) {
      setContent(STATIC_CONTENT[activeTab]);
    } else {
      setContent('');
    }
  }, [activeTab]);

  if (!subject) {
    navigate('/subjects');
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.id,
          semester: semester,
          subject: subject.name,
          type: activeTab
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

  const handleExport = async (format) => {
    try {
      const currentTab = [...STATIC_TABS, ...AI_TABS].find(t => t.id === activeTab);
      const title = `${subject.code} - ${currentTab.label}`;
      
      const response = await fetch(`http://localhost:5000/api/download/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export document. Is the backend running?');
    }
  };

  const isStaticTab = STATIC_CONTENT[activeTab] !== undefined;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="top-nav" style={{ marginBottom: '1.5rem' }}>
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>{subject.code}</span>
            <span>-</span>
            <span>{subject.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary"><Settings size={18} /> Settings</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Sidebar Tabs */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
          
          <div>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Static Content</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {STATIC_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', border: activeTab === tab.id ? 'none' : '', fontSize: '0.9rem', padding: '0.6rem 1rem' }}
                  onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
                >
                  <Info size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>AI Generated</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {AI_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', border: activeTab === tab.id ? 'none' : '', fontSize: '0.9rem', padding: '0.6rem 1rem' }}
                  onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
                >
                  <Sparkles size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.5rem' }}>{[...STATIC_TABS, ...AI_TABS].find(t => t.id === activeTab)?.label}</h3>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {content && (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <><Save size={18} /> Save</> : <><Edit3 size={18} /> Edit</>}
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
                    <Download size={18} /> PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('docx')}>
                    <Download size={18} /> DOCX
                  </button>
                </>
              )}
              
              {!isStaticTab && (
                <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <><RefreshCw size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }}/> Generating...</> : <><Sparkles size={18} /> Generate AI Content</>}
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {!content && !isGenerating ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Click "Generate AI Content" to start creating materials.</p>
              </div>
            ) : isGenerating ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }}></div>
                <p>Gemini is analyzing the syllabus...</p>
              </div>
            ) : (
              isEditing ? (
                <textarea 
                  className="input-field"
                  style={{ flex: 1, resize: 'none', border: 'none', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              ) : (
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {content}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
