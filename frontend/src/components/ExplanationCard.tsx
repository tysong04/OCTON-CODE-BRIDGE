import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    <div className="explanation-analysis-panel">
      <div className="analysis-panel-header">
        <div className="analysis-title">
          <Sparkles size={14} className="accent-cyan" />
          <span>Translation Overview & Key Adjustments</span>
        </div>
        <div className="review-advisory">
          <CheckCircle2 size={13} color="var(--accent-emerald)" />
          <span>Manual review recommended</span>
        </div>
      </div>

      <div className="analysis-content-grid">
        {explanation && (
          <div className="analysis-section">
            <h4 className="analysis-section-heading">Idiom & Structural Notes</h4>
            <div className="analysis-body-text">{explanation}</div>
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div className="analysis-section warnings-box">
            <h4 className="analysis-section-heading warning-heading">
              <AlertTriangle size={13} />
              <span>Assumptions & Caveats</span>
            </h4>
            <ul className="warnings-list">
              {warnings.map((warn, idx) => (
                <li key={idx} className="warning-list-item">
                  <span className="warning-bullet">&bull;</span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
