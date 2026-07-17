import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Book, FileText, AlertCircle, RefreshCw, Layers } from 'lucide-react';

const SubjectSelection = () => {
  const navigate = useNavigate();
  const { department, regulation, semester, subjects, loadingSubjs, fetchSubjects, setSubject } = useAppContext();

  useEffect(() => {
    if (!department || !semester) {
      navigate('/departments');
      return;
    }
    fetchSubjects(department.id, semester);
  }, [department, semester]);

  if (!department || !semester || !regulation) {
    return null;
  }

  const theorySubjects = [];
  const labSubjects = [];

  subjects.forEach(subj => {
    const type = subj.subjectType || (subj.isLab ? 'lab' : 'theory');
    if (type === 'theory' || type === 'combined') {
      theorySubjects.push(subj);
    }
    if (type === 'lab' || type === 'combined') {
      labSubjects.push(subj);
    }
  });

  // Navigate to CourseContent with correct mode injected
  const handleSelectSubject = (subj, mode = null) => {
    if (mode === 'lab') {
      setSubject({ ...subj, isLab: true, _mode: 'lab' });
    } else if (mode === 'theory') {
      setSubject({ ...subj, isLab: false, _mode: 'theory' });
    } else {
      setSubject(subj);
    }
    navigate('/course-content');
  };

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--primary)' }}>{department.id}</span>
            <span>&gt;</span>
            <span style={{ color: 'var(--primary)' }}>{regulation}</span>
            <span>&gt;</span>
            <span style={{ color: 'var(--primary)' }}>Sem {semester}</span>
            <span>&gt;</span>
            <span>Select Subject</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Available Subjects</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select a subject to generate course materials.</p>
      </div>

      {loadingSubjs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--primary)' }}>
          <RefreshCw size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading subjects from database...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
          <p>No subjects found for {department.id} in Semester {semester}. Ask an Admin to add them.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

          {/* ── Theory Subjects ── */}
          {theorySubjects.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.5rem'
              }}>
                <Book size={18} style={{ color: 'var(--primary)' }} />
                Theory Subjects
              </h3>
              <div className="selection-grid-subjects">
                {theorySubjects.map((subj) => (
                  <div
                    key={`${subj.id}-theory`}
                    className="glass-card"
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      transition: 'all 0.2s',
                      borderLeft: '3px solid #2563eb'
                    }}
                    onClick={() => handleSelectSubject(subj, 'theory')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '0.75rem', color: '#2563eb', flexShrink: 0 }}>
                      <Book size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="badge">{subj.code}</div>
                      </div>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: 1.4, fontWeight: '700' }}>
                        {subj.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        <FileText size={14} /> Ready for generation
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Laboratory Subjects ── */}
          {labSubjects.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.5rem'
              }}>
                <FileText size={18} style={{ color: '#10b981' }} />
                Laboratory Subjects
              </h3>
              <div className="selection-grid-subjects">
                {labSubjects.map((subj) => (
                  <div
                    key={`${subj.id}-lab`}
                    className="glass-card"
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      transition: 'all 0.2s',
                      borderLeft: '3px solid #10b981'
                    }}
                    onClick={() => handleSelectSubject(subj, 'lab')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', color: '#10b981', flexShrink: 0 }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="badge">{subj.code}</div>
                      </div>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: 1.4, fontWeight: '700' }}>
                        {subj.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        <FileText size={14} /> Ready for generation
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default SubjectSelection;
