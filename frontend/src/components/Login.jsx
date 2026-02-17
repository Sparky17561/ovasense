import { useState } from "react";
import { loginUser, getMe } from "../api";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

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
                navigate("/dashboard", { replace: true });
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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">

                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff2d78] to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[#ff2d78]/20 mb-4">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 font-['Lora'] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Login to access your personalized health insights
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                            required
                        />
                    </div>

                    <button
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Logging in...</span>
                            </div>
                        ) : "Login"}
                    </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-[1px] bg-[#222] flex-1" />
                    <span className="text-gray-500 text-xs font-medium">OR</span>
                    <div className="h-[1px] bg-[#222] flex-1" />
                </div>

                <button
                    className="w-full bg-transparent border border-[#333] hover:border-pink-500/50 hover:bg-pink-500/5 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-all"
                    onClick={() => navigate("/register")}
                >
                    Create New Account
                </button>
            </div>
        </div>
    );
}
