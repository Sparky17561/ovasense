import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api';
import './VoiceButton.css';

function VoiceButton({ onTranscript, onResponse, conversationHistory, currentData, disabled }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);

    useEffect(() => {
        // Initialize audio context
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                // Create blob - let MediaRecorder use its default format
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: audioChunksRef.current[0]?.type || 'audio/webm'
                });
                await sendToBackend(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError(null);

            // Auto-stop after 5 seconds
            setTimeout(() => {
                if (mediaRecorderRef.current && isRecording) {
                    stopRecording();
                }
            }, 5000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendToBackend = async (audioBlob) => {
        setIsProcessing(true);

        try {
            const formData = new FormData();

            // Determine file extension from blob type
            const extension = audioBlob.type.includes('webm') ? 'webm' :
                audioBlob.type.includes('wav') ? 'wav' :
                    audioBlob.type.includes('mp4') ? 'mp4' : 'webm';

            formData.append('audio', audioBlob, `recording.${extension}`);

            formData.append('conversation_history', JSON.stringify(conversationHistory || []));
            formData.append('current_data', JSON.stringify(currentData || {}));

            const response = await api.post('/voice/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { transcript, response_text, response_audio, extracted_data, ready_for_classification } = response.data;

            // Callback with transcript
            if (onTranscript && transcript) {
                onTranscript(transcript);
            }

            // Callback with response
            if (onResponse && response_text) {
                onResponse(response_text, extracted_data, ready_for_classification);
            }

            // Play response audio
            if (response_audio) {
                playAudio(response_audio);
            }

        } catch (err) {
            console.error('Error processing voice:', err);
            setError('Failed to process audio. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const playAudio = async (base64Audio) => {
        try {
            // Decode base64 to array buffer
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const audioContext = audioContextRef.current;
            const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);

        } catch (err) {
            console.error('Error playing audio:', err);
        }
    };

    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else if (!isProcessing) {
            startRecording();
        }
    };

    return (
        <div className="voice-button-container">
            <button
                className={`btn btn-icon voice-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                onClick={handleClick}
                disabled={disabled || isProcessing}
                title={isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : 'Start voice input'}
            >
                {isProcessing ? '⏳' : isRecording ? '⏹️' : '🎤'}
            </button>
            {error && <p className="voice-error">{error}</p>}
            {isRecording && <p className="listening-indicator">Recording... (auto-stops in 5s)</p>}
            {isProcessing && <p className="listening-indicator">Processing with Baymax AI...</p>}
        </div>
    );
}

VoiceButton.propTypes = {
    onTranscript: PropTypes.func.isRequired,
    onResponse: PropTypes.func,
    conversationHistory: PropTypes.array,
    disabled: PropTypes.bool
};

export default VoiceButton;
