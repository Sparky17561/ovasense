import { useState, useEffect } from "react";
import { listCycles, predictCycle, logCycle, deleteCycle } from "../api";
import { 
    Calendar as CalendarIcon, 
    Plus, 
    X, 
    Droplets, 
    History, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CalendarDays,
    Trash2
} from "lucide-react";

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

    const handleDelete = async (cycleId) => {
        if (!window.confirm("Are you sure you want to delete this cycle log?")) {
            return;
        }

        try {
            await deleteCycle(cycleId);
            loadData(); // Reload the list
        } catch (e) {
            console.error("Error deleting:", e);
            setError("Failed to delete cycle. Please try again.");
        }
    };

    return (
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-['Lora'] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-1">
                        Period Tracker
                    </h1>
                    <p className="text-gray-400 text-sm">Track your cycles for smarter PCOS insights</p>
                </div>

                <button 
                    onClick={() => setShowForm(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-pink-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Log Period
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Prediction Card */}
            {prediction?.next_period_date && (
                <div className="mb-6 md:mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative bg-[#111] border border-pink-500/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 backdrop-blur-sm text-center md:text-left">
                        
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                            <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                                <CalendarDays className="w-8 h-8 text-pink-500" />
                            </div>
                            <div>
                                <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Next Period Expected</h3>
                                <div className="text-3xl md:text-4xl font-bold text-white font-['Lora']">
                                    {new Date(prediction.next_period_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 md:gap-8 text-center md:text-right border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-8 w-full md:w-auto mt-2 md:mt-0 justify-center md:justify-end">
                            <div>
                                <div className="text-2xl font-bold text-white">{prediction.average_cycle_length} <span className="text-sm font-normal text-gray-500">days</span></div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Cycle</div>
                            </div>
                            {prediction.confidence && (
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{prediction.confidence}%</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">Confidence</div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* Cycle History List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-white">Cycle History</h2>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-[#111] border border-[#222] rounded-xl" />
                        ))}
                    </div>
                ) : cycles.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-[#111]/50">
                        <CalendarIcon className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No periods logged yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">Start tracking your cycle to get accurate predictions and health insights.</p>
                        <button onClick={() => setShowForm(true)} className="text-pink-500 hover:text-pink-400 font-medium">Log your first period</button>
                    </div>
                ) : (
                    <div className="grid gap-3 md:gap-4">
                        {cycles.map((cycle) => (
                            <div key={cycle.id} className="group bg-[#111] border border-[#222] hover:border-pink-500/30 rounded-xl p-4 md:p-5 transition-all flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
                                
                                <div className="flex justify-between md:block min-w-[140px]">
                                    <div>
                                        <div className="text-base md:text-lg font-bold text-white">
                                            {new Date(cycle.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {cycle.cycle_length && (
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-gray-400 border border-neutral-700">
                                                {cycle.cycle_length} Days
                                            </span>
                                        )}
                                    </div>
                                    {/* Mobile only icon */}
                                    <div className="md:hidden flex items-center" title={`Flow Intensity: ${cycle.flow_intensity || 'Unknown'}`}>
                                        <Droplets className="w-4 h-4 text-pink-500" />
                                        <span className="ml-1 text-sm text-gray-400">{cycle.flow_intensity || 3}/5</span>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="flex items-center gap-1.5" title={`Flow Intensity: ${cycle.flow_intensity || 'Unknown'}`}>
                                            <Droplets className="w-4 h-4 text-pink-500" />
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <div 
                                                        key={level} 
                                                        className={`w-1.5 h-1.5 rounded-full ${level <= (cycle.flow_intensity || 0) ? 'bg-pink-500' : 'bg-neutral-700'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {cycle.symptoms?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {cycle.symptoms.slice(0, 3).map((s, i) => (
                                                <span key={i} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300">
                                                    {s}
                                                </span>
                                            ))}
                                            {cycle.symptoms.length > 3 && (
                                                <span className="text-xs text-gray-500 py-1">+{cycle.symptoms.length - 3} more</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {cycle.notes && (
                                    <div className="hidden md:block w-px h-10 bg-neutral-800 mx-2" />
                                )}
                                
                                {cycle.notes && (
                                    <div className="text-sm text-gray-500 italic max-w-xs truncate md:truncate-0">
                                        "{cycle.notes}"
                                    </div>
                                )}

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(cycle.id)}
                                    className="ml-auto p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all group-hover:opacity-100 opacity-0 md:opacity-100"
                                    title="Delete this cycle"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Log Period Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowForm(false)}>
                    <div 
                        className="bg-[#111] border border-[#333] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#222]">
                            <h2 className="text-lg md:text-xl font-bold text-white">Log Period</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleLog} className="p-4 md:p-6 space-y-4 md:space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        required
                                        className="w-full bg-[#1a1a1a] border border-[#333] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className="w-full bg-[#1a1a1a] border border-[#333] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Flow Intensity</label>
                                <div className="flex items-center justify-between gap-2 p-3 bg-[#1a1a1a] rounded-xl border border-[#333]">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <label key={level} className="cursor-pointer group relative">
                                            <input type="radio" name="flow_intensity" value={level} className="peer sr-only" defaultChecked={level === 3} />
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold bg-[#111] text-gray-500 border border-[#333] peer-checked:bg-pink-500 peer-checked:text-white peer-checked:border-pink-500 transition-all hover:border-gray-500">
                                                {level}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                                    <span>Light</span>
                                    <span>Heavy</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Symptoms</label>
                                <input
                                    type="text"
                                    name="symptoms"
                                    placeholder="e.g. cramps, bloating, headache"
                                    className="w-full bg-[#1a1a1a] border border-[#333] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-sm placeholder-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    placeholder="Any additional details..."
                                    className="w-full bg-[#1a1a1a] border border-[#333] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-sm placeholder-gray-600 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2.5 bg-transparent border border-[#333] hover:bg-[#1a1a1a] text-gray-300 rounded-xl font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-pink-500/20 transition-all"
                                >
                                    Save Log
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
