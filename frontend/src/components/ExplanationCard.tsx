import React from 'react';
import { Info, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ExplanationCardProps {
  explanation: string;
  warnings: string[];
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  explanation,
  warnings,
}) => {
  if (!explanation && (!warnings || warnings.length === 0)) {
    return null;
  }

  return (
    <div className="explanation-section">
      <div className="explanation-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={18} color="var(--accent-cyan)" />
          <span>Translation Overview & Key Adjustments</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} color="#34d399" />
          <span>Safe Local Processing</span>
        </div>
      </div>

      {explanation && <div className="explanation-body">{explanation}</div>}

      {warnings && warnings.length > 0 && (
        <div className="warnings-container">
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={14} />
            <span>Assumptions & Behavioral Notices</span>
          </div>
          {warnings.map((warn, idx) => (
            <div key={idx} className="warning-item">
              <span>&bull;</span>
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
