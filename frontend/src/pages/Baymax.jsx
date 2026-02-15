import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import VoiceButton from '../components/VoiceButton';
import { classifySymptoms, processText } from '../api';
import { downloadReport } from '../api';
import './Baymax.css';

function Baymax() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [symptomData, setSymptomData] = useState({
        cycle_gap_days: null,
        acne: null,
        bmi: null,
        stress_level: null,
        sleep_hours: null
    });
    const [currentQuestion, setCurrentQuestion] = useState('cycle_gap');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [conversationComplete, setConversationComplete] = useState(false);
    const chatEndRef = useRef(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Show welcome message on first load
        if (!initialized && messages.length === 0) {
            setTimeout(() => {
                addMessage('assistant', 'Hello! I\'m Baymax, your personal healthcare companion. I\'m here to help you understand your PCOS symptoms. How are you feeling today?');
                setInitialized(true);
            }, 500);
        }
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (sender, text) => {
        const newMessage = {
            sender,
            text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);

        // Note: Speech is now handled by server-side voice pipeline (Kokoro TTS)
        // Voice responses come from the /api/voice/ endpoint
    };

    const processUserInput = async (text) => {
        addMessage('user', text);
        setIsProcessing(true);

        try {
            const response = await processText(text, messages, symptomData);

            // Add Baymax's response
            if (response.response_text) {
                setTimeout(() => {
                    addMessage('assistant', response.response_text);
                }, 500);
            }

            // Update symptom data
            if (response.extracted_data) {
                setSymptomData(prev => ({ ...prev, ...response.extracted_data }));
            }

            // Check if done
            if (response.ready_for_classification) {
                console.log('🎯 All data collected via text! Submitting...', response.extracted_data);

                setTimeout(async () => {
                    await submitSymptoms(response.extracted_data || symptomData);
                    setCurrentQuestion('support');
                }, 1500);
            } else {
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Error processing text:', error);
            addMessage('assistant', 'I apologize, but I encountered an error. Please try again.');
            setIsProcessing(false);
        }
    };

    const submitSymptoms = async (data) => {
        try {
            const response = await classifySymptoms(data);
            setResult(response);

            // Show result in chat (voice already played from Groq's closing message)
            const resultMessage = `Based on your symptoms, my assessment indicates: **${response.phenotype}** with ${response.confidence.toFixed(0)}% confidence. Here are the key factors I considered: ${response.reasons.join('; ')}. Would you like to download a detailed report?`;

            setTimeout(() => {
                addMessage('assistant', resultMessage);

                // After result, enable mental health support mode
                setConversationComplete(false);
                setCurrentQuestion('support');

                // Add support mode transition message
                setTimeout(() => {
                    const supportMsg = "I'm here to support you through this. How are you feeling? Would you like to talk about managing stress, improving sleep, or any other concerns?";
                    addMessage('assistant', supportMsg);
                }, 2000);
            }, 1000);

        } catch (error) {
            console.error('Error submitting symptoms:', error);
            addMessage('assistant', 'I apologize, but I encountered an error while analyzing your data. Please try again later.');
        }
    };

    const handleSendMessage = () => {
        if (inputText.trim() && !isProcessing && !conversationComplete) {
            processUserInput(inputText);
            setInputText('');
        }
    };

    const handleVoiceTranscript = (transcript) => {
        if (!conversationComplete) {
            // Add user's transcribed message to UI
            addMessage('user', transcript);
        }
    };

    const handleVoiceResponse = async (responseText, extractedData, readyForClassification) => {
        // Voice response already played via TTS
        // Now add Baymax's Groq-generated response to the UI
        if (responseText) {
            setTimeout(() => {
                addMessage('assistant', responseText);
            }, 300);
        }

        console.log('Voice response received:', responseText);
        console.log('Extracted data:', extractedData);
        console.log('Ready for classification:', readyForClassification);

        // Always update symptom data with any extracted fields
        if (extractedData) {
            setSymptomData(prev => ({ ...prev, ...extractedData }));
        }

        // If all data is collected, automatically submit for classification
        if (readyForClassification && extractedData) {
            console.log('🎯 All data collected! Submitting to ML engine:', extractedData);
            setIsProcessing(true);

            // Brief pause before submitting
            setTimeout(async () => {
                await submitSymptoms(extractedData);
                // Don't set conversationComplete - instead switch to support mode
                setCurrentQuestion('support');
                setIsProcessing(false);
            }, 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDownloadReport = () => {
        if (result && result.result_id) {
            window.open(downloadReport(result.result_id), '_blank');
        }
    };

    const getPhenotypeColor = (phenotype) => {
        const colors = {
            'Low Risk': '#06D6A0',
            'Moderate Risk': '#FFB627',
            'Insulin Resistant PCOS': '#EF476F',
            'Lean PCOS': '#A23B72',
            'Stress-Induced Irregularity': '#F18F01'
        };
        return colors[phenotype] || '#66FCF1';
    };

    const resetConversation = () => {
        // Clear all state to start fresh
        setMessages([]);
        setSymptomData({
            cycle_gap_days: null,
            acne: null,
            bmi: null,
            stress_level: null,
            sleep_hours: null
        });
        setCurrentQuestion('cycle_gap');
        setIsProcessing(false);
        setResult(null);
        setConversationComplete(false);
        setInputText('');
        setInitialized(true); // Prevent duplicate welcome message

        // Add welcome message
        setTimeout(() => {
            addMessage('assistant', 'Hello! I\'m Baymax, your personal healthcare companion. I\'m here to help you understand your PCOS symptoms. How are you feeling today?');
        }, 500);
    };

    return (
        <div className="baymax-container fade-in">
            <div className="baymax-header">
                <button className="btn btn-back" onClick={() => navigate('/')}>
                    ← Back to Dashboard
                </button>
                <h1 className="baymax-title">
                    <span className="baymax-icon">🤖</span> Baymax Assistant
                </h1>
                <button className="btn btn-secondary" onClick={resetConversation}>
                    🔄 New Conversation
                </button>
            </div>

            <div className="chat-container glass-card">
                <ChatBox messages={messages} />
                <div ref={chatEndRef} />

                {!conversationComplete && (
                    <div className="input-container">
                        <input
                            type="text"
                            className="input-field chat-input"
                            placeholder={currentQuestion === 'support' ? "Share your thoughts or ask for support..." : "Type your response or use voice..."}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isProcessing}
                        />
                        <VoiceButton
                            onTranscript={handleVoiceTranscript}
                            onResponse={handleVoiceResponse}
                            conversationHistory={messages}
                            currentData={symptomData}
                            disabled={isProcessing}
                        />
                        <button
                            className="btn btn-primary send-btn"
                            onClick={handleSendMessage}
                            disabled={isProcessing || !inputText.trim()}
                        >
                            Send
                        </button>
                    </div>
                )}

                {result && (
                    <div className="result-section">
                        <div className="result-card-baymax" style={{ borderColor: getPhenotypeColor(result.phenotype) }}>
                            <h3 className="result-title">Assessment Complete</h3>
                            <div className="result-phenotype-badge" style={{ backgroundColor: getPhenotypeColor(result.phenotype) }}>
                                {result.phenotype}
                            </div>
                            <p className="result-confidence">Confidence: {result.confidence.toFixed(0)}%</p>

                            <div className="result-actions">
                                <button className="btn btn-success" onClick={handleDownloadReport}>
                                    📄 Download Report
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                    View Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="processing-indicator">
                        <div className="spinner"></div>
                        <p>Processing...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Baymax;
