import {
    BrowserRouter as Router,
    Routes,
    Route,
    NavLink,
    Navigate,
    useLocation
} from "react-router-dom";

import { useEffect, useState } from "react";
import { getMe } from "./api";

import Analyse from "./pages/Analyse";
import Dashboard from "./pages/Dashboard";
import Knowledge from "./pages/Knowledge";
import PeriodCalendar from "./pages/PeriodCalendar";
import Baymax from "./pages/Baymax";

import Login from "./components/Login";
import Register from "./components/Register";

import { 
    LayoutDashboard, 
    Microscope, 
    BookOpen, 
    Calendar, 
    Bot, 
    Menu, 
    X 
} from "lucide-react";

import "./index.css";

/* ===============================
   PROTECTED ROUTE
================================= */
function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [auth, setAuth] = useState(false);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, [location.pathname]);

    const checkAuth = async () => {
        try {
            const res = await getMe();
            setAuth(res.authenticated === true);
        } catch {
            setAuth(false);
        }
        setLoading(false);
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-500 animate-pulse">Checking session...</div>;

    if (!auth) return <Navigate to="/login" replace />;

    return children;
}

/* ===============================
   SIDEBAR COMPONENT
================================= */
function Sidebar({ isOpen, onClose }) {
    const navItems = [
        { path: "/", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
        { path: "/analyse", icon: <Microscope className="w-5 h-5" />, label: "Analyse" },
        { path: "/calendar", icon: <Calendar className="w-5 h-5" />, label: "Period Tracker" },
        { path: "/knowledge", icon: <BookOpen className="w-5 h-5" />, label: "Knowledge Base" },
        { path: "/baymax", icon: <Bot className="w-5 h-5" />, label: "Baymax" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside 
                className={`
                    fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0f0f0f] border-r border-[#222] flex flex-col transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Logo */}
                <div className="p-6 border-b border-[#222] flex items-center justify-between">
                    <h1 className="text-2xl font-bold font-['Lora'] tracking-tight text-white">
                        Ova<span className="text-[#ff2d78]">Sense</span>
                    </h1>
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()} // Close on mobile when clicked
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                                ${isActive 
                                    ? "bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/20" 
                                    : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent"}
                                `
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[#222] text-center">
                    <p className="text-xs text-[#555]">OvaSense AI v2.0</p>
                </div>
            </aside>
        </>
    );
}

/* ===============================
   APP LAYOUT
================================= */
function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                
                {/* Mobile Header / Hamburger */}
                <div className="md:hidden p-4 flex items-center justify-between border-b border-[#222] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-30">
                    <h1 className="text-xl font-bold font-['Lora'] text-white">
                        Ova<span className="text-[#ff2d78]">Sense</span>
                    </h1>
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1a1a]"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto w-full scroll-smooth">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/analyse" element={<Analyse />} />
                        <Route path="/knowledge" element={<Knowledge />} />
                        <Route path="/calendar" element={<PeriodCalendar />} />
                        <Route path="/baymax" element={<Baymax />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

/* ===============================
   MAIN APP
================================= */
function App() {
    return (
        <Router>
            <Routes>

                {/* PUBLIC */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* PROTECTED */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
