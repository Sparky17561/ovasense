import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Baymax from './pages/Baymax';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/baymax" element={<Baymax />} />
            </Routes>
        </Router>
    );
}

export default App;
