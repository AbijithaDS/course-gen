import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BookOpen } from 'lucide-react';

const REGULATIONS = ['2017', '2021', '2023', '2025'];

const RegulationSelection = () => {
  const navigate = useNavigate();
  const { department, setRegulation } = useAppContext();

  if (!department) {
    navigate('/departments');
    return null;
  }

  const handleSelect = (reg) => {
    setRegulation(reg);
    navigate('/semester');
  };

  return (
    <div className="animate-fade-in">
      <div className="top-nav">
        <div className="nav-left">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--primary)' }}>{department.id}</span> &gt; Select Regulation
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Academic Regulation</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Select the regulation year for your curriculum.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {REGULATIONS.map((reg) => (
          <div 
            key={reg} 
            className="glass-card"
            style={{ cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', padding: '2rem' }}
            onClick={() => handleSelect(reg)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#e0e7ff', borderRadius: '50%', color: 'var(--primary)' }}>
                <BookOpen size={32} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Regulation {reg}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Curriculum {reg}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegulationSelection;
