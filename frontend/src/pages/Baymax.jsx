// import { useState, useEffect, useRef, useCallback } from 'react';
// import { processText } from '../api';
// import './Baymax.css';

// export default function Baymax() {
//     const [isListening, setIsListening] = useState(false);
//     const [isSpeaking, setIsSpeaking] = useState(false);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [transcript, setTranscript] = useState('');
//     const [responseText, setResponseText] = useState('');
//     const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
//     const [conversationHistory, setConversationHistory] = useState([]);
//     const [waveAmplitudes, setWaveAmplitudes] = useState(new Array(32).fill(0));

//     const mediaRecorderRef = useRef(null);
//     const audioChunksRef = useRef([]);
//     const audioContextRef = useRef(null);
//     const analyserRef = useRef(null);
//     const animFrameRef = useRef(null);
//     const streamRef = useRef(null);

//     // Cleanup on unmount
//     useEffect(() => {
//         return () => {
//             stopListening();
//             if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
//         };
//     }, []);

//     // Waveform animation for speaking state
//     useEffect(() => {
//         let interval;
//         if (isSpeaking) {
//             interval = setInterval(() => {
//                 setWaveAmplitudes(prev =>
//                     prev.map(() => Math.random() * 0.6 + 0.2)
//                 );
//             }, 80);
//         } else if (status === 'idle') {
//             setWaveAmplitudes(new Array(32).fill(0));
//         }
//         return () => clearInterval(interval);
//     }, [isSpeaking, status]);

//     // Animate waveform from mic input
//     const animateMicWave = useCallback(() => {
//         if (!analyserRef.current) return;
//         const data = new Uint8Array(analyserRef.current.frequencyBinCount);
//         analyserRef.current.getByteFrequencyData(data);

//         // Sample 32 bands
//         const bands = 32;
//         const step = Math.floor(data.length / bands);
//         const amps = [];
//         for (let i = 0; i < bands; i++) {
//             amps.push(data[i * step] / 255);
//         }
//         setWaveAmplitudes(amps);
//         animFrameRef.current = requestAnimationFrame(animateMicWave);
//     }, []);

//     const startListening = async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             streamRef.current = stream;

//             // Setup audio analyser for waveform
//             audioContextRef.current = new AudioContext();
//             const source = audioContextRef.current.createMediaStreamSource(stream);
//             analyserRef.current = audioContextRef.current.createAnalyser();
//             analyserRef.current.fftSize = 256;
//             source.connect(analyserRef.current);

//             // Start recording
//             const mediaRecorder = new MediaRecorder(stream);
//             mediaRecorderRef.current = mediaRecorder;
//             audioChunksRef.current = [];

//             mediaRecorder.ondataavailable = (e) => {
//                 if (e.data.size > 0) audioChunksRef.current.push(e.data);
//             };

//             mediaRecorder.onstop = async () => {
//                 const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
//                 await handleVoiceSubmit(blob);
//             };

//             mediaRecorder.start();
//             setIsListening(true);
//             setStatus('listening');
//             setTranscript('');
//             setResponseText('');

//             // Start waveform animation
//             animateMicWave();

//         } catch (err) {
//             console.error('Mic error:', err);
//             setStatus('idle');
//         }
//     };

//     const stopListening = () => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//             mediaRecorderRef.current.stop();
//         }
//         if (streamRef.current) {
//             streamRef.current.getTracks().forEach(t => t.stop());
//         }
//         if (audioContextRef.current) {
//             audioContextRef.current.close();
//         }
//         if (animFrameRef.current) {
//             cancelAnimationFrame(animFrameRef.current);
//         }
//         setIsListening(false);
//     };

//     const handleVoiceSubmit = async (audioBlob) => {
//         setStatus('processing');
//         setIsProcessing(true);
//         setWaveAmplitudes(new Array(32).fill(0.1));

//         try {
//             const response = await processVoice(audioBlob, conversationHistory);

//             setTranscript(response.transcript || '');
//             setResponseText(response.response_text || '');

//             // Update conversation history
//             setConversationHistory(prev => [
//                 ...prev,
//                 { role: 'user', content: response.transcript || '' },
//                 { role: 'assistant', content: response.response_text || '' }
//             ]);

//             // Play audio response
//             if (response.response_audio) {
//                 setStatus('speaking');
//                 setIsSpeaking(true);

//                 const audioBytes = Uint8Array.from(atob(response.response_audio), c => c.charCodeAt(0));
//                 const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
//                 const audioUrl = URL.createObjectURL(audioBlob);
//                 const audio = new Audio(audioUrl);

//                 audio.onended = () => {
//                     setIsSpeaking(false);
//                     setStatus('idle');
//                     URL.revokeObjectURL(audioUrl);
//                 };

//                 audio.onerror = () => {
//                     setIsSpeaking(false);
//                     setStatus('idle');
//                     URL.revokeObjectURL(audioUrl);
//                 };

//                 await audio.play();
//             } else {
//                 setStatus('idle');
//             }
//         } catch (err) {
//             console.error('Voice processing error:', err);
//             setResponseText('Sorry, something went wrong. Please try again.');
//             setStatus('idle');
//         }
//         setIsProcessing(false);
//     };

//     const handleMicClick = () => {
//         if (isListening) {
//             stopListening();
//         } else if (!isProcessing && !isSpeaking) {
//             startListening();
//         }
//     };

//     const getStatusText = () => {
//         switch (status) {
//             case 'listening': return 'Listening...';
//             case 'processing': return 'Thinking...';
//             case 'speaking': return 'Speaking...';
//             default: return 'Tap to talk';
//         }
//     };

//     const getStatusColor = () => {
//         switch (status) {
//             case 'listening': return '#ff2d78';
//             case 'processing': return '#8338EC';
//             case 'speaking': return '#22c55e';
//             default: return '#333';
//         }
//     };

//     return (
//         <div className="baymax-page">
//             {/* Ambient background */}
//             <div className="baymax-ambient" style={{
//                 background: status !== 'idle'
//                     ? `radial-gradient(circle at 50% 60%, ${getStatusColor()}15, transparent 70%)`
//                     : 'none'
//             }} />

//             {/* Center content */}
//             <div className="baymax-center">
//                 {/* Waveform visualizer */}
//                 <div className="waveform-container">
//                     <div className="waveform">
//                         {waveAmplitudes.map((amp, i) => (
//                             <div
//                                 key={i}
//                                 className="wave-bar"
//                                 style={{
//                                     height: `${Math.max(4, amp * 120)}px`,
//                                     background: getStatusColor(),
//                                     opacity: 0.4 + amp * 0.6,
//                                     transition: status === 'speaking' ? 'height 0.08s ease' : 'height 0.05s ease',
//                                 }}
//                             />
//                         ))}
//                     </div>
//                 </div>

//                 {/* Mic Button */}
//                 <button
//                     className={`mic-button ${status}`}
//                     onClick={handleMicClick}
//                     disabled={isProcessing}
//                     style={{ '--status-color': getStatusColor() }}
//                 >
//                     <div className="mic-icon">
//                         {status === 'listening' ? (
//                             <svg viewBox="0 0 24 24" className="mic-svg"><rect x="9" y="2" width="6" height="14" rx="3" fill="currentColor" /><path d="M5 11a7 7 0 0014 0" fill="none" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" /></svg>
//                         ) : status === 'processing' ? (
//                             <div className="spinner"></div>
//                         ) : status === 'speaking' ? (
//                             <svg viewBox="0 0 24 24" className="mic-svg"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" /><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor" /><path d="M19 12c0 2.97-1.65 5.54-4 6.71v2.06c3.45-1.28 6-4.56 6-8.77s-2.55-7.49-6-8.77v2.06c2.35 1.17 4 3.74 4 6.71z" fill="currentColor" /></svg>
//                         ) : (
//                             <svg viewBox="0 0 24 24" className="mic-svg"><rect x="9" y="2" width="6" height="14" rx="3" fill="currentColor" /><path d="M5 11a7 7 0 0014 0" fill="none" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" /></svg>
//                         )}
//                     </div>
//                     {(status === 'listening' || status === 'speaking') && (
//                         <div className="pulse-ring" />
//                     )}
//                 </button>

//                 {/* Status */}
//                 <p className="status-text" style={{ color: getStatusColor() }}>
//                     {getStatusText()}
//                 </p>

//                 {/* Transcript & Response */}
//                 <div className="voice-text-area">
//                     {transcript && (
//                         <div className="voice-bubble user fade-in">
//                             <span className="bubble-label">You</span>
//                             <p>{transcript}</p>
//                         </div>
//                     )}
//                     {responseText && (
//                         <div className="voice-bubble assistant fade-in">
//                             <span className="bubble-label">Baymax</span>
//                             <p>{responseText}</p>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Bottom branding */}
//             <div className="baymax-brand">
//                 <span>💜</span> Baymax — Your Wellness Companion
//             </div>
//         </div>
//     );
// }



import { useState } from 'react';
import { processText } from '../api';
import './Baymax.css';

export default function Baymax() {
    const [conversationHistory, setConversationHistory] = useState([]);
    const [textInput, setTextInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!textInput.trim()) return;

        const userMessage = textInput;
        setTextInput("");
        setLoading(true);

        try {
            const res = await processText(
                userMessage,
                conversationHistory,
                {}   // later we can send collected PCOS data here
            );

            setConversationHistory(prev => [
                ...prev,
                { role: "user", content: userMessage },
                { role: "assistant", content: res.response_text || "I'm here to help 💜" }
            ]);
        } catch (e) {
            console.error(e);
            setConversationHistory(prev => [
                ...prev,
                { role: "assistant", content: "Something went wrong. Please try again." }
            ]);
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    return (
        <div className="baymax-page">

            {/* Header */}
            <div className="baymax-header">
                <h1>💜 Baymax</h1>
                <p>Your AI PCOS Wellness Companion</p>
            </div>

            {/* Chat Area */}
            <div className="chat-container">
                {conversationHistory.length === 0 && (
                    <div className="empty-chat">
                        <p>Hi! I’m Baymax 🤖</p>
                        <p>Ask me about your cycle, stress, acne, sleep, or PCOS health.</p>
                    </div>
                )}

                {conversationHistory.map((msg, i) => (
                    <div
                        key={i}
                        className={`voice-bubble ${msg.role === "user" ? "user" : "assistant"}`}
                    >
                        <span className="bubble-label">
                            {msg.role === "user" ? "You" : "Baymax"}
                        </span>
                        <p>{msg.content}</p>
                    </div>
                ))}

                {loading && (
                    <div className="voice-bubble assistant">
                        <span className="bubble-label">Baymax</span>
                        <p>Thinking…</p>
                    </div>
                )}
            </div>

            {/* Input Box */}
            <div className="chat-input-container">
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Baymax about your health..."
                />
                <button onClick={sendMessage} disabled={loading}>
                    Send
                </button>
            </div>

            {/* Footer */}
            <div className="baymax-brand">
                💜 Baymax — Your Wellness Companion
            </div>
        </div>
    );
}
