import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import VoiceButton from '../components/VoiceButton';
import { classifySymptoms } from '../api';
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

    const extractNumber = (text) => {
        const match = text.match(/\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : null;
    };

    const extractBoolean = (text) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('yes') || lowerText.includes('yeah') || lowerText.includes('yep')) {
            return true;
        }
        if (lowerText.includes('no') || lowerText.includes('nope') || lowerText.includes('nah')) {
            return false;
        }
        return null;
    };

    const processUserInput = async (text) => {
        addMessage('user', text);
        setIsProcessing(true);

        let value = null;
        let nextQuestion = null;
        let responseText = '';
        let updatedSymptomData = { ...symptomData };

        switch (currentQuestion) {
            case 'cycle_gap':
                value = extractNumber(text);
                if (value !== null && value > 0 && value < 365) {
                    updatedSymptomData.cycle_gap_days = Math.round(value);
                    setSymptomData(updatedSymptomData);
                    nextQuestion = 'acne';
                    responseText = 'Got it. Do you currently have acne or skin breakouts?';
                } else {
                    responseText = 'I didn\'t quite understand that. Please tell me the number of days since your last period (for example, "30 days" or "45").';
                }
                break;

            case 'acne':
                value = extractBoolean(text);
                if (value !== null) {
                    updatedSymptomData.acne = value;
                    setSymptomData(updatedSymptomData);
                    nextQuestion = 'bmi';
                    responseText = 'Thank you. What is your Body Mass Index (BMI)? If you don\'t know it, you can estimate or say a number between 15 and 40.';
                } else {
                    responseText = 'Please answer with yes or no. Do you have acne?';
                }
                break;

            case 'bmi':
                value = extractNumber(text);
                if (value !== null && value >= 15 && value <= 50) {
                    updatedSymptomData.bmi = value;
                    setSymptomData(updatedSymptomData);
                    nextQuestion = 'stress';
                    responseText = 'Understood. On a scale of 1 to 10, how would you rate your stress level? (1 being very low, 10 being very high)';
                } else {
                    responseText = 'Please provide a valid BMI value between 15 and 50.';
                }
                break;

            case 'stress':
                value = extractNumber(text);
                if (value !== null && value >= 1 && value <= 10) {
                    updatedSymptomData.stress_level = Math.round(value);
                    setSymptomData(updatedSymptomData);
                    nextQuestion = 'sleep';
                    responseText = 'Got it. Finally, how many hours of sleep do you typically get per night?';
                } else {
                    responseText = 'Please provide a stress level between 1 and 10.';
                }
                break;

            case 'sleep':
                value = extractNumber(text);
                if (value !== null && value >= 0 && value <= 24) {
                    updatedSymptomData.sleep_hours = value;
                    setSymptomData(updatedSymptomData);

                    responseText = 'Thank you for providing all the information. Let me analyze your symptoms...';
                    addMessage('assistant', responseText);

                    // Submit complete data to ML engine
                    console.log('Submitting complete symptom data:', updatedSymptomData);
                    await submitSymptoms(updatedSymptomData);
                    setIsProcessing(false);
                    setConversationComplete(true);
                    return;
                } else {
                    responseText = 'Please provide a valid number of sleep hours (0-24).';
                }
                break;

            default:
                responseText = 'I\'m not sure what to ask next. Let\'s start over.';
        }

        setCurrentQuestion(nextQuestion || currentQuestion);
        setTimeout(() => {
            addMessage('assistant', responseText);
            setIsProcessing(false);
        }, 500);
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
