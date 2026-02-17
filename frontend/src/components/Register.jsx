import { useState } from "react";
import { registerUser } from "../api";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Register() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await registerUser({
                username,
                password,
                name,
                age,
                height_cm: height
            });

            alert("Registered successfully!");
            navigate("/");

        } catch (e) {
            console.log(e.response?.data);
            alert(JSON.stringify(e.response?.data));
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <h1>Create Account 🌸</h1>

                <form onSubmit={handleSubmit}>

                    <input
                        placeholder="Username"
                        onChange={e => setUsername(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <input
                        placeholder="Name"
                        onChange={e => setName(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Age"
                        onChange={e => setAge(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Height (cm)"
                        onChange={e => setHeight(e.target.value)}
                    />

                    <button className="btn-primary">
                        Register
                    </button>

                </form>

                <div className="auth-divider">OR</div>

                <button
                    className="btn-secondary"
                    onClick={() => navigate("/login")}
                >
                    Back to Login
                </button>

            </div>
        </div>
    );
}
