/**
 * API client for interacting with Django backend
 */
import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Log symptoms without classification
 */
export const logSymptoms = async (symptomData) => {
    const response = await api.post('/log/', symptomData);
    return response.data;
};

/**
 * Submit symptoms and get classification with AI analysis
 */
export const classifySymptoms = async (symptomData) => {
    const response = await api.post('/classify/', symptomData);
    return response.data;
};

/**
 * Get all symptom history with results
 */
export const getHistory = async () => {
    const response = await api.get('/history/');
    return response.data;
};

/**
 * Download PDF report URL
 */
export const downloadReport = (resultId) => {
    return `${API_BASE_URL}/report/${resultId}/`;
};

/**
 * Process text chat message (for Baymax mental health)
 */
export const processText = async (text, conversationHistory, currentData) => {
    const response = await api.post('/text/', {
        text,
        conversation_history: conversationHistory,
        current_data: currentData
    });
    return response.data;
};

/**
 * Process voice input - sends audio blob, returns transcript + response + audio
 */
export const processVoice = async (audioBlob, conversationHistory = [], currentData = {}) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('conversation_history', JSON.stringify(conversationHistory));
    formData.append('current_data', JSON.stringify(currentData));

    const response = await axios.post(`${API_BASE_URL}/voice/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// ============================================================
// HEALTH COMPANION APIs
// ============================================================

/**
 * Period Tracking
 */
export const logCycle = async (cycleData) => {
    const response = await api.post('/cycle/log/', cycleData);
    return response.data;
};

export const listCycles = async (userId, limit = 10) => {
    const response = await api.get(`/cycle/list/?user_id=${userId}&limit=${limit}`);
    return response.data;
};

export const predictCycle = async (userId) => {
    const response = await api.get(`/cycle/predict/?user_id=${userId}`);
    return response.data;
};

/**
 * Knowledge Base
 */
export const listArticles = async (category = null) => {
    let url = '/articles/';
    if (category) url += `?category=${category}`;
    const response = await api.get(url);
    return response.data;
};

export const getArticle = async (articleId) => {
    const response = await api.get(`/articles/${articleId}/`);
    return response.data;
};

export default api;
