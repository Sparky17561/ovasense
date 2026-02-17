import { useState, useEffect } from "react";
import { listCycles, predictCycle, logCycle } from "../api";
import "./PeriodCalendar.css";

export default function PeriodCalendar() {
    const [cycles, setCycles] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [cycleData, predData] = await Promise.allSettled([
                listCycles(12),
                predictCycle()
            ]);

            if (cycleData.status === "fulfilled") {
                setCycles(cycleData.value);
            }

            if (predData.status === "fulfilled") {
                setPrediction(predData.value);
            }
        } catch (e) {
            console.error("Load error:", e);
            setError("Failed to load data.");
        }

        setLoading(false);
    };

    const handleLog = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);

        try {
            await logCycle({
                start_date: fd.get("start_date"),
                end_date: fd.get("end_date") || null,
                flow_intensity: parseInt(fd.get("flow_intensity") || 3),
                symptoms:
                    fd
                        .get("symptoms")
                        ?.split(",")
                        .map((s) => s.trim())
                        .filter(Boolean) || [],
                notes: fd.get("notes") || ""
            });

            setShowForm(false);
            loadData();
        } catch (e) {
            console.error("Error logging:", e);
            setError("Failed to log period. Are you logged in?");
        }
    };

    return (
        <div className="page-container fade-in">

            {/* Header */}
            <div
                className="page-header"
                style={{ display: "flex", justifyContent: "space-between" }}
            >
                <div>
                    <h1>Period Tracker</h1>
                    <p>Track your cycles for smarter PCOS insights</p>
                </div>

                <button className="btn btn-pink" onClick={() => setShowForm(true)}>
                    + Log Period
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="card" style={{ background: "#ffe5e5", marginBottom: "16px" }}>
                    {error}
                </div>
            )}

            {/* Prediction */}
            {prediction?.next_period_date && (
                <div className="card prediction-card">
                    <h3>Next Period Expected</h3>
                    <p>
                        {new Date(prediction.next_period_date).toLocaleDateString()}
                    </p>
                    <p>
                        Avg cycle: {prediction.average_cycle_length} days
                        {prediction.confidence && (
                            <> • Confidence: {prediction.confidence}%</>
                        )}
                    </p>
                </div>
            )}

            {/* Cycle History */}
            <h2 className="section-title">Cycle History</h2>

            {loading ? (
                <p>Loading...</p>
            ) : cycles.length === 0 ? (
                <div className="empty-state">
                    <p>No periods logged yet.</p>
                </div>
            ) : (
                <div className="cycles-list">
                    {cycles.map((cycle) => (
                        <div key={cycle.id} className="card cycle-item">

                            <div className="cycle-top">
                                <b>
                                    {new Date(cycle.start_date).toLocaleDateString()}
                                </b>

                                {cycle.cycle_length && (
                                    <span className="badge badge-pink">
                                        {cycle.cycle_length} days
                                    </span>
                                )}
                            </div>

                            <div className="cycle-details">
                                <p>Flow: {cycle.flow_intensity || "—"}</p>

                                {cycle.symptoms?.length > 0 && (
                                    <p>Symptoms: {cycle.symptoms.join(", ")}</p>
                                )}

                                {cycle.notes && (
                                    <p>Notes: {cycle.notes}</p>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Log Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal card" onClick={(e) => e.stopPropagation()}>
                        <h2>Log Period</h2>

                        <form onSubmit={handleLog}>

                            <div className="field">
                                <label>Start Date</label>
                                <input
                                    className="input"
                                    type="date"
                                    name="start_date"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label>End Date</label>
                                <input className="input" type="date" name="end_date" />
                            </div>

                            <div className="field">
                                <label>Flow Intensity (1-5)</label>
                                <input
                                    className="input"
                                    type="number"
                                    name="flow_intensity"
                                    min="1"
                                    max="5"
                                    defaultValue="3"
                                />
                            </div>

                            <div className="field">
                                <label>Symptoms (comma-separated)</label>
                                <input
                                    className="input"
                                    type="text"
                                    name="symptoms"
                                    placeholder="cramps, bloating, headache"
                                />
                            </div>

                            <div className="field">
                                <label>Notes</label>
                                <textarea
                                    className="input"
                                    name="notes"
                                    rows="3"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>

                                <button type="submit" className="btn btn-pink">
                                    Log Period
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
