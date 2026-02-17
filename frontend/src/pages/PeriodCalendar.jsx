import { useState, useEffect } from 'react';
import { listCycles, predictCycle, logCycle } from '../api';
import './PeriodCalendar.css';

export default function PeriodCalendar() {
    const [cycles, setCycles] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const userId = 'demo_user';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cycleData, predData] = await Promise.allSettled([
                listCycles(userId, 12),
                predictCycle(userId)
            ]);
            if (cycleData.status === 'fulfilled') setCycles(cycleData.value);
            if (predData.status === 'fulfilled') setPrediction(predData.value);
        } catch (e) {
            console.error('Error:', e);
        }
        setLoading(false);
    };

    const handleLog = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await logCycle({
                user: userId,
                start_date: fd.get('start_date'),
                flow_intensity: parseInt(fd.get('flow_intensity')),
                symptoms: fd.get('symptoms')?.split(',').map(s => s.trim()).filter(Boolean) || [],
                notes: fd.get('notes') || ''
            });
            setShowForm(false);
            loadData();
        } catch (e) {
            console.error('Error logging:', e);
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Period Tracker</h1>
                    <p>Track your menstrual cycles and get predictions</p>
                </div>
                <button className="btn btn-pink" onClick={() => setShowForm(true)}>
                    + Log Period
                </button>
            </div>

            {/* Prediction */}
            {prediction?.next_period_date && (
                <div className="card prediction-card">
                    <div className="prediction-content">
                        <div className="prediction-left">
                            <span className="prediction-label">Next period expected</span>
                            <span className="prediction-date">
                                {new Date(prediction.next_period_date).toLocaleDateString('en-US', {
                                    month: 'long', day: 'numeric', year: 'numeric'
                                })}
                            </span>
                            <div className="prediction-meta">
                                <span>In {prediction.days_until} days</span>
                                <span>•</span>
                                <span>Avg cycle: {prediction.average_cycle_length} days</span>
                            </div>
                        </div>
                        <div className="prediction-confidence">
                            <span className="conf-value">{prediction.confidence}%</span>
                            <span className="conf-label">Confidence</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Cycle History */}
            <h2 className="section-title">Cycle History</h2>
            {loading ? (
                <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : cycles.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3>No periods logged yet</h3>
                    <p>Start tracking by clicking "Log Period"</p>
                </div>
            ) : (
                <div className="cycles-list">
                    {cycles.map(cycle => (
                        <div key={cycle.id} className="card cycle-item">
                            <div className="cycle-top">
                                <span className="cycle-date">
                                    {new Date(cycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {cycle.cycle_length && (
                                    <span className="badge badge-pink">{cycle.cycle_length} days</span>
                                )}
                            </div>
                            <div className="cycle-details">
                                <div className="flow-bar">
                                    <span className="flow-label">Flow</span>
                                    <div className="flow-dots">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`flow-dot ${i <= (cycle.flow_intensity || 0) ? 'active' : ''}`} />
                                        ))}
                                    </div>
                                </div>
                                {cycle.symptoms?.length > 0 && (
                                    <div className="cycle-symptoms">
                                        {cycle.symptoms.map((s, i) => (
                                            <span key={i} className="symptom-tag">{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Log Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal card" onClick={e => e.stopPropagation()}>
                        <h2>Log Period</h2>
                        <form onSubmit={handleLog}>
                            <div className="field">
                                <label>Start Date</label>
                                <input className="input" type="date" name="start_date" required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="field">
                                <label>Flow Intensity (1-5)</label>
                                <input className="input" type="number" name="flow_intensity" min="1" max="5" defaultValue="3" />
                            </div>
                            <div className="field">
                                <label>Symptoms (comma-separated)</label>
                                <input className="input" type="text" name="symptoms" placeholder="cramps, headache, bloating" />
                            </div>
                            <div className="field">
                                <label>Notes</label>
                                <textarea className="input" name="notes" rows="3" placeholder="Optional notes..." />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-pink">Log Period</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
