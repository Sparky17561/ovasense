import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../api';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getHistory();
            setHistory(data);
        } catch (e) {
            console.error('Error:', e);
        }
        setLoading(false);
    };

    const latestResult = history.length > 0 && history[0].result ? {
        ...history[0].result,
        created_at: history[0].created_at
    } : null;

    const getPhenotypeStyle = (phenotype) => {
        if (!phenotype) return 'badge-pink';
        if (phenotype.includes('Insulin')) return 'badge-red';
        if (phenotype.includes('Lean')) return 'badge-yellow';
        if (phenotype.includes('Low Risk') || phenotype.includes('Non-PCOS')) return 'badge-green';
        return 'badge-pink';
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Your PCOS health summary at a glance</p>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="action-card card" onClick={() => navigate('/analyse')}>
                    <span className="action-icon">🔬</span>
                    <div>
                        <h3>New Analysis</h3>
                        <p>Run a PCOS symptom assessment</p>
                    </div>
                </button>
                <button className="action-card card" onClick={() => navigate('/calendar')}>
                    <span className="action-icon">📅</span>
                    <div>
                        <h3>Period Tracker</h3>
                        <p>Log and predict your cycles</p>
                    </div>
                </button>
                <button className="action-card card" onClick={() => navigate('/knowledge')}>
                    <span className="action-icon">📚</span>
                    <div>
                        <h3>Knowledge Base</h3>
                        <p>Learn about PCOS management</p>
                    </div>
                </button>
                <button className="action-card card" onClick={() => navigate('/baymax')}>
                    <span className="action-icon">💜</span>
                    <div>
                        <h3>Baymax</h3>
                        <p>Mental health support chat</p>
                    </div>
                </button>
            </div>

            {/* Latest Result */}
            {latestResult && (
                <div className="latest-section">
                    <h2>Latest Assessment</h2>
                    <div className="card latest-card">
                        <div className="latest-top">
                            <div>
                                <span className={`badge ${getPhenotypeStyle(latestResult.phenotype)}`}>
                                    {latestResult.phenotype}
                                </span>
                                <p className="latest-date">
                                    {new Date(latestResult.created_at).toLocaleDateString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="latest-confidence">
                                <span className="confidence-number">{latestResult.confidence?.toFixed(0)}%</span>
                                <span className="confidence-label">Confidence</span>
                            </div>
                        </div>
                        <div className="latest-reasons">
                            {latestResult.reasons?.slice(0, 3).map((r, i) => (
                                <div key={i} className="reason-item">{r}</div>
                            ))}
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/analyse')}>
                            View Full Report →
                        </button>
                    </div>
                </div>
            )}

            {/* Recent History */}
            {history.length > 0 && (
                <div className="history-section">
                    <div className="section-header">
                        <h2>Recent Assessments</h2>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/analyse')}>
                            View All
                        </button>
                    </div>
                    <div className="history-table card">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Result</th>
                                    <th>Confidence</th>
                                    <th>Cycle Gap</th>
                                    <th>BMI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice(0, 5).map(item => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                        <td>
                                            <span className={`badge ${getPhenotypeStyle(item.result?.phenotype)}`}>
                                                {item.result?.phenotype || '—'}
                                            </span>
                                        </td>
                                        <td>{item.result?.confidence?.toFixed(0) || '—'}%</td>
                                        <td>{item.cycle_gap_days || '—'} days</td>
                                        <td>{item.bmi || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && history.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">🔬</div>
                    <h3>No assessments yet</h3>
                    <p>Run your first PCOS analysis to see results here</p>
                    <button className="btn btn-pink" onClick={() => navigate('/analyse')} style={{ marginTop: '16px' }}>
                        Start Analysis
                    </button>
                </div>
            )}
        </div>
    );
}
