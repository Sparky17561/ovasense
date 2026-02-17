import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, getCycleInsight, logoutUser } from "../api";
import SkeletonDashboard from "../components/SkeletonDashboard";
import { 
    Activity, 
    Calendar, 
    BookOpen, 
    Bot, 
    LogOut, 
    RefreshCcw, 
    ChevronRight,
    TrendingUp,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

export default function Dashboard() {
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

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

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (e) {
            console.error("Logout error:", e);
        }
        navigate("/login", { replace: true });
    };

    const latestResult =
        history.length > 0 && history[0].result
            ? { ...history[0].result, created_at: history[0].created_at }
            : null;

    const getPhenotypeColor = (phenotype) => {
        if (!phenotype) return "text-pink-500 bg-pink-500/10 border-pink-500/20";
        if (phenotype.includes("Insulin")) return "text-red-400 bg-red-500/10 border-red-500/20";
        if (phenotype.includes("Lean")) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
        if (phenotype.includes("Low Risk") || phenotype.includes("Non-PCOS"))
            return "text-green-400 bg-green-500/10 border-green-500/20";
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
    };

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-['Lora'] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-1">
                        Dashboard
                    </h1>
                    <p className="text-gray-400 text-sm">Your PCOS health summary at a glance</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleRefresh}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 rounded-xl border border-neutral-700 hover:border-pink-500/50 hover:bg-pink-500/5 text-gray-300 transition-all text-sm font-medium"
                    >
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 rounded-xl border border-neutral-700 hover:border-red-500/50 hover:bg-red-500/5 text-gray-300 hover:text-red-400 transition-all text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                
                <ActionCard 
                    icon={<Activity className="w-6 h-6 text-pink-500" />}
                    title="New Analysis"
                    desc="Run a PCOS symptom assessment"
                    onClick={() => navigate("/analyse")}
                />
                
                <ActionCard 
                    icon={<Calendar className="w-6 h-6 text-purple-500" />}
                    title="Period Tracker"
                    desc="Log and predict your cycles"
                    onClick={() => navigate("/calendar")}
                />

                <ActionCard 
                    icon={<BookOpen className="w-6 h-6 text-blue-500" />}
                    title="Knowledge Base"
                    desc="Learn about PCOS management"
                    onClick={() => navigate("/knowledge")}
                />

                <ActionCard 
                    icon={<Bot className="w-6 h-6 text-emerald-500" />}
                    title="Baymax"
                    desc="AI wellness companion"
                    onClick={() => navigate("/baymax")}
                />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                
                {/* AI INSIGHT */}
                <div className="lg:col-span-2">
                    {insight ? (
                        <div className="h-full bg-[#111] border border-[#222] rounded-2xl p-5 md:p-6 hover:border-purple-500/30 transition-all relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-600/15 transition-all pointer-events-none" />
                            
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-white">This Week’s AI Insight</h2>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-2 text-sm text-purple-300 bg-purple-500/10 w-fit px-3 py-1 rounded-full border border-purple-500/20">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Phase: {insight.phase || "Unknown"} {insight.cycle_day && `(Day ${insight.cycle_day})`}</span>
                                </div>

                                <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                                    {insight.main_reason}
                                </p>

                                {insight.recommendations?.length > 0 && (
                                    <ul className="grid gap-2 mt-4">
                                        {insight.recommendations.map((r, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                         <div className="h-full bg-[#111] border border-[#222] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                            <Bot className="w-12 h-12 text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Insights Yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">Track your cycle or log symptoms to get personalized AI health insights.</p>
                            <button 
                                onClick={() => navigate("/calendar")}
                                className="text-purple-400 hover:text-purple-300 text-sm font-medium hover:underline"
                            >
                                Go to Period Tracker →
                            </button>
                        </div>
                    )}
                </div>

                {/* LATEST ASSESSMENT */}
                <div>
                    {latestResult ? (
                        <div className="h-full bg-[#111] border border-[#222] rounded-2xl p-5 md:p-6 hover:border-pink-500/30 transition-all flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Latest Assessment</h2>
                                <span className="text-xs text-gray-500">{new Date(latestResult.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center text-center mb-6">
                                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                     <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-800" />
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={351.858} strokeDashoffset={351.858 * (1 - (latestResult.confidence || 0) / 100)} className="text-pink-500 transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{latestResult.confidence?.toFixed(0)}<span className="text-sm text-gray-500">%</span></span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPhenotypeColor(latestResult.phenotype)}`}>
                                    {latestResult.phenotype}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => navigate("/analyse")}
                                className="w-full mt-auto py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-gray-300 transition-all text-sm font-medium flex items-center justify-center gap-2 group"
                            >
                                View Full Report
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <div className="h-full bg-[#111] border border-[#222] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                            <Activity className="w-12 h-12 text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Analysis Yet</h3>
                            <p className="text-gray-500 mb-6">Run your first PCOS symptom assessment to get a phenotype classification.</p>
                            <button 
                                onClick={() => navigate("/analyse")}
                                className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function ActionCard({ icon, title, desc, onClick }) {
    return (
        <button 
            onClick={onClick}
            className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 p-4 md:p-5 bg-[#111] border border-[#222] rounded-2xl hover:bg-[#151515] hover:border-pink-500/30 transition-all text-center md:text-left group w-full h-full"
        >
            <div className="p-3 rounded-xl bg-neutral-900 group-hover:bg-neutral-800 transition-colors shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-gray-200 text-sm group-hover:text-white transition-colors">{title}</h3>
                <p className="text-xs text-gray-500 mt-1 md:mt-0.5 leading-snug">{desc}</p>
            </div>
        </button>
    );
}
