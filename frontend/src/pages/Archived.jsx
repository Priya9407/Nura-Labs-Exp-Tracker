import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as experimentsAPI from '../api/experiments';
import { useAuth } from '../context/AuthContext';
import {
  getPhaseDisplay,
  formatRelativeTime,
  getDecisionDisplay,
  getDecisionColor,
} from '../utils/format';

function Archived() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await experimentsAPI.listExperiments('archived');
      // Filter completed and archived experiments
      const archived = (response.experiments || []).filter(
        (e) => e.status === 'COMPLETED' || e.status === 'ARCHIVED' || e.status === 'CANCELLED'
      );
      setExperiments(archived);
    } catch (err) {
      setError(err.message || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const completedCount = experiments.filter((e) => e.status === 'COMPLETED').length;
  const archivedCount = experiments.filter((e) => e.status === 'ARCHIVED').length;
  const cancelledCount = experiments.filter((e) => e.status === 'CANCELLED').length;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Archived Experiments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
            View completed and archived experiments
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="stat-card">
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{archivedCount}</div>
          <div className="stat-label">Archived</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cancelledCount}</div>
          <div className="stat-label">Cancelled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{experiments.length}</div>
          <div className="stat-label">Total Archived</div>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <div className="loading" style={{ fontSize: '1.5rem' }}>
            <span className="spinner"></span>
            Loading experiments...
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!loading && !error && experiments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No archived experiments</div>
          <p className="empty-state-text">Completed or archived experiments will appear here</p>
        </div>
      )}

      {!loading && !error && experiments.length > 0 && (
        <div className="grid grid-3">
          {experiments.map((exp) => {
            const phaseDisplay = getPhaseDisplay(exp.current_phase);
            const isOwner = exp.owner === user?.uuid;

            return (
              <div
                key={exp.uuid}
                className="card animate-fade-in"
                onClick={() => navigate(`/experiment/${exp.uuid}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                      <span className={`badge badge-status-${exp.status.toLowerCase()}`}>
                        {exp.status}
                      </span>
                      {exp.decision && (
                        <span
                          className="badge"
                          style={{
                            background: `${getDecisionColor(exp.decision.decision)}33`,
                            color: getDecisionColor(exp.decision.decision),
                          }}
                        >
                          {getDecisionDisplay(exp.decision.decision)}
                        </span>
                      )}
                    </div>
                    <h4 className="card-title">{exp.title}</h4>
                    <p className="card-subtitle">{exp.exp_no}{exp.domain ? ` • ${exp.domain}` : ''}</p>
                  </div>
                </div>
                <div className="card-body">
                  {exp.assumption_statement && (
                    <p>
                      {exp.assumption_statement.substring(0, 100)}
                      {exp.assumption_statement.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="card-footer">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {isOwner ? 'You' : (exp.owner_info?.name || 'Unknown')}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {formatRelativeTime(exp.updated_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Archived;
