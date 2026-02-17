import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Analyse from './pages/Analyse';
import Dashboard from './pages/Dashboard';
import Knowledge from './pages/Knowledge';
import PeriodCalendar from './pages/PeriodCalendar';
import Baymax from './pages/Baymax';
import './index.css';

function Sidebar() {
    const location = useLocation();

    const navItems = [
        { path: '/analyse', icon: '🔬', label: 'Analyse' },
        { path: '/', icon: '📊', label: 'Dashboard' },
        { path: '/knowledge', icon: '📚', label: 'Knowledge Base' },
        { path: '/calendar', icon: '📅', label: 'Period Tracker' },
        { path: '/baymax', icon: '💜', label: 'Baymax' },
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
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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

function App() {
    return (
        <Router>
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
        </Router>
    );
}

export default App;
