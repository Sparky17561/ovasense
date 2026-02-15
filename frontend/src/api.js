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
 * Submit symptoms and get classification
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
 * Download PDF report
 */
export const downloadReport = (resultId) => {
    return `${API_BASE_URL}/report/${resultId}/`;
};

export default api;
