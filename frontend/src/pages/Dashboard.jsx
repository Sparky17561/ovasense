import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, getCycleInsight, logoutUser } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    /* ===============================
        LOAD DASHBOARD DATA
    =============================== */
    const loadDashboard = async () => {
        setLoading(true);

        try {
            const historyData = await getHistory();
            const insightData = await getCycleInsight();

            setHistory(historyData || []);
            setInsight(insightData || null);

        } catch (e) {
            console.error("Dashboard load error:", e);

            if (e.response?.status === 401) {
                navigate("/login", { replace: true });
            }
        }

        setLoading(false);
    };

    /* ===============================
        REFRESH BUTTON
    =============================== */
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    /* ===============================
        LOGOUT
    =============================== */
    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (e) {
            console.error("Logout error:", e);
        }

        navigate("/login", { replace: true });
    };

    /* ===============================
        Helpers
    =============================== */
    const latestResult =
        history.length > 0 && history[0].result
            ? { ...history[0].result, created_at: history[0].created_at }
            : null;

    const getPhenotypeStyle = (phenotype) => {
        if (!phenotype) return "badge-pink";
        if (phenotype.includes("Insulin")) return "badge-red";
        if (phenotype.includes("Lean")) return "badge-yellow";
        if (phenotype.includes("Low Risk") || phenotype.includes("Non-PCOS"))
            return "badge-green";
        return "badge-pink";
    };

    /* ===============================
        UI
    =============================== */
    return (
        <div className="page-container fade-in">

            {/* HEADER */}
            <div className="page-header dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Your PCOS health summary at a glance</p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        className="btn btn-outline"
                        onClick={handleRefresh}
                    >
                        {refreshing ? "Refreshing..." : "Refresh 🔄"}
                    </button>

                    <button
                        className="btn btn-outline logout-btn"
                        onClick={handleLogout}
                    >
                        Logout 🚪
                    </button>
                </div>
            </div>

            {loading && <p style={{ marginTop: 20 }}>Loading dashboard...</p>}

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="action-card card" onClick={() => navigate("/analyse")}>
                    <span className="action-icon">🔬</span>
                    <div>
                        <h3>New Analysis</h3>
                        <p>Run a PCOS symptom assessment</p>
                    </div>
                </button>

                <button className="action-card card" onClick={() => navigate("/calendar")}>
                    <span className="action-icon">📅</span>
                    <div>
                        <h3>Period Tracker</h3>
                        <p>Log and predict your cycles</p>
                    </div>
                </button>

                <button className="action-card card" onClick={() => navigate("/knowledge")}>
                    <span className="action-icon">📚</span>
                    <div>
                        <h3>Knowledge Base</h3>
                        <p>Learn about PCOS management</p>
                    </div>
                </button>

                <button className="action-card card" onClick={() => navigate("/baymax")}>
                    <span className="action-icon">💜</span>
                    <div>
                        <h3>Baymax</h3>
                        <p>AI wellness companion</p>
                    </div>
                </button>
            </div>

            {/* AI Insight */}
            {insight && (
                <div className="card ai-insight" style={{ marginBottom: "24px" }}>
                    <h2>🧠 This Week’s AI Insight</h2>

                    <p>
                        <b>Cycle Phase:</b> {insight.phase || "Unknown"}
                        {insight.cycle_day && ` (Day ${insight.cycle_day})`}
                    </p>

                    <p style={{ marginTop: "10px", fontSize: "16px" }}>
                        {insight.main_reason}
                    </p>

                    {insight.recommendations?.length > 0 && (
                        <ul style={{ marginTop: "10px" }}>
                            {insight.recommendations.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                    )}

                    <div style={{ marginTop: "10px", fontWeight: "bold" }}>
                        Risk Score: {insight.risk_score}%
                    </div>
                </div>
            )}

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
                                    {new Date(latestResult.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="latest-confidence">
                                <span className="confidence-number">
                                    {latestResult.confidence?.toFixed(0)}%
                                </span>
                                <span className="confidence-label">Confidence</span>
                            </div>
                        </div>

                        <div className="latest-reasons">
                            {latestResult.reasons?.slice(0, 3).map((r, i) => (
                                <div key={i} className="reason-item">{r}</div>
                            ))}
                        </div>

                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate("/analyse")}
                        >
                            View Full Report →
                        </button>
                    </div>
                </div>
            )}

            {!loading && history.length === 0 && (
                <div className="empty-state">
                    <h3>No assessments yet</h3>
                    <p>Run your first PCOS analysis</p>

                    <button
                        className="btn btn-pink"
                        onClick={() => navigate("/analyse")}
                        style={{ marginTop: "16px" }}
                    >
                        Start Analysis
                    </button>
                </div>
            )}
        </div>
    );
}
