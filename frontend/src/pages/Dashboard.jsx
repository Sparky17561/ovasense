import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [latestResult, setLatestResult] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getHistory();
            setHistory(data);

            // Get latest result
            if (data.length > 0 && data[0].result) {
                setLatestResult({
                    ...data[0].result,
                    created_at: data[0].created_at
                });
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    // Prepare chart data
    const chartData = history.map(item => ({
        date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cycle_gap: item.cycle_gap_days
    })).reverse();

    const getPhenotypeColor = (phenotype) => {
        const colors = {
            'Low Risk': '#06D6A0',
            'Moderate Risk': '#FFB627',
            'Insulin Resistant PCOS': '#EF476F',
            'Lean PCOS': '#A23B72',
            'Stress-Induced Irregularity': '#F18F01'
        };
        return colors[phenotype] || '#66FCF1';
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading your health data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container fade-in">
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">
                    Ova<span className="gradient-text">Sense</span> AI
                </h1>
                <p className="dashboard-subtitle">Your Personal PCOS Health Assistant</p>
            </div>

            {/* CTA Section */}
            <div className="cta-section glass-card">
                <div className="cta-content">
                    <h2>How are you feeling today?</h2>
                    <p>Talk to Baymax to track your symptoms and get personalized insights</p>
                    <button className="btn btn-primary btn-large" onClick={() => navigate('/baymax')}>
                        <span className="btn-icon-text">💬</span>
                        Talk to Baymax
                    </button>
                </div>
            </div>

            {/* Latest Result */}
            {latestResult && (
                <div className="latest-result-section">
                    <h2 className="section-title">Latest Assessment</h2>
                    <div className="result-card glass-card" style={{ borderLeftColor: getPhenotypeColor(latestResult.phenotype) }}>
                        <div className="result-header">
                            <div>
                                <h3 className="result-phenotype">{latestResult.phenotype}</h3>
                                <p className="result-date">
                                    {new Date(latestResult.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="confidence-badge" style={{ backgroundColor: getPhenotypeColor(latestResult.phenotype) }}>
                                {latestResult.confidence.toFixed(0)}%
                            </div>
                        </div>
                        <div className="result-reasons">
                            <h4>Key Factors:</h4>
                            <ul>
                                {latestResult.reasons.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {chartData.length > 0 && (
                <div className="chart-section">
                    <h2 className="section-title">Cycle Trends</h2>
                    <div className="chart-card glass-card">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#C5C6C7" />
                                <YAxis stroke="#C5C6C7" label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fill: '#C5C6C7' } }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 30, 40, 0.9)',
                                        border: '1px solid rgba(162, 59, 114, 0.5)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cycle_gap"
                                    stroke="#A23B72"
                                    strokeWidth={3}
                                    dot={{ fill: '#A23B72', r: 5 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* History */}
            <div className="history-section">
                <h2 className="section-title">Symptom History</h2>
                {history.length === 0 ? (
                    <div className="empty-state glass-card">
                        <p className="empty-icon">📋</p>
                        <p>No symptom logs yet</p>
                        <p className="empty-subtitle">Start by talking to Baymax about your symptoms</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {history.map((item) => (
                            <div key={item.id} className="history-item glass-card">
                                <div className="history-header">
                                    <span className="history-date">
                                        {new Date(item.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    {item.result && (
                                        <span
                                            className="history-phenotype"
                                            style={{ backgroundColor: getPhenotypeColor(item.result.phenotype) }}
                                        >
                                            {item.result.phenotype}
                                        </span>
                                    )}
                                </div>
                                <div className="history-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Cycle Gap:</span>
                                        <span className="detail-value">{item.cycle_gap_days} days</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">BMI:</span>
                                        <span className="detail-value">{item.bmi}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Stress:</span>
                                        <span className="detail-value">{item.stress_level}/10</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Sleep:</span>
                                        <span className="detail-value">{item.sleep_hours}h</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
