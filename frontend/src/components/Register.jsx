import { useState } from "react";
import { registerUser } from "../api";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Register() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await registerUser({
                username,
                password,
                name,
                age,
                height_cm: height
            });

            alert("Registered successfully!");
            navigate("/login");

        } catch (e) {
            console.log(e.response?.data);
            alert(JSON.stringify(e.response?.data) || "Registration failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">

                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff2d78] to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[#ff2d78]/20 mb-4">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 font-['Lora'] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Join OvaSense to start your journey
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <input
                                placeholder="Full Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                            />
                        </div>

                        <input
                            type="number"
                            placeholder="Age"
                            value={age}
                            onChange={e => setAge(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                        />

                        <input
                            type="number"
                            placeholder="Height (cm)"
                            value={height}
                            onChange={e => setHeight(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                        />
                    </div>

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
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>

                </form>

                <div className="flex items-center gap-4 my-6">
                    <div className="h-[1px] bg-[#222] flex-1" />
                    <span className="text-gray-500 text-xs font-medium">OR</span>
                    <div className="h-[1px] bg-[#222] flex-1" />
                </div>

                <div className="text-center">
                    <button
                        className="text-gray-400 hover:text-pink-500 text-sm font-medium transition-colors"
                        onClick={() => navigate("/login")}
                    >
                        Already have an account? <span className="text-pink-500 hover:underline">Login</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
