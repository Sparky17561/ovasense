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

    if (loading) return <div className="page-container">Checking session...</div>;

    if (!auth) return <Navigate to="/login" replace />;

    return children;
}

/* ===============================
   SIDEBAR
================================= */
function Sidebar() {
    const navItems = [
        { path: "/", icon: "📊", label: "Dashboard" },
        { path: "/analyse", icon: "🔬", label: "Analyse" },
        { path: "/knowledge", icon: "📚", label: "Knowledge Base" },
        { path: "/calendar", icon: "📅", label: "Period Tracker" },
        { path: "/baymax", icon: "💜", label: "Baymax" },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <h1>Ova<span>Sense</span></h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? "active" : ""}`
                        }
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                OvaSense AI v2.0
            </div>
        </aside>
    );
}

/* ===============================
   APP LAYOUT
================================= */
function AppLayout() {
    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analyse" element={<Analyse />} />
                    <Route path="/knowledge" element={<Knowledge />} />
                    <Route path="/calendar" element={<PeriodCalendar />} />
                    <Route path="/baymax" element={<Baymax />} />
                </Routes>
            </main>
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
