import { useState } from "react";
import { loginUser, getMe } from "../api";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1️⃣ Login request
            await loginUser({ username, password });

            // 2️⃣ Wait for cookie to be stored
            await new Promise(res => setTimeout(res, 300));

            // 3️⃣ Check session
            const me = await getMe();

            if (me.authenticated) {
                navigate("/", { replace: true });
                window.location.reload();   // refresh ProtectedRoute
            } else {
                alert("Login failed. Session not created.");
            }

        } catch (err) {
            console.error(err);
            alert("Login failed. Check username/password.");
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <h1>Welcome Back 💜</h1>
                <p className="auth-sub">Login to continue to OvaSense</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <button className="btn-primary" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="auth-divider">OR</div>

                <button
                    className="btn-secondary"
                    onClick={() => navigate("/register")}
                >
                    Create New Account
                </button>

            </div>
        </div>
    );
}
