/**
 * API client for Django backend
 * Works with Django Session Auth + CSRF
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

/* ==========================================
   CREATE AXIOS INSTANCE
========================================== */
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,   // 🔥 VERY IMPORTANT
    headers: {
        "Content-Type": "application/json",
    },
});

/* ==========================================
   CSRF AUTO CONFIG
========================================== */
api.defaults.xsrfCookieName = "csrftoken";
api.defaults.xsrfHeaderName = "X-CSRFToken";

/* ==========================================
   GET CSRF COOKIE FIRST
========================================== */
export const initCSRF = async () => {
    await api.get("/auth/csrf/");
};

/* ==========================================
   AUTH APIs
========================================== */
export const registerUser = async (data) => {
    await initCSRF();   // 🔥 REQUIRED
    const res = await api.post("/auth/register/", data);
    return res.data;
};

export const loginUser = async (data) => {
    await initCSRF();   // 🔥 REQUIRED
    const res = await api.post("/auth/login/", data);
    return res.data;
};

export const logoutUser = async () => {
    await initCSRF();   // 🔥 REQUIRED
    const res = await api.post("/auth/logout/");
    return res.data;
};

export const getMe = async () => {
    const res = await api.get("/auth/me/");
    return res.data;
};

/* ==========================================
   PCOS APIs
========================================== */
export const logSymptoms = async (symptomData) => {
    await initCSRF();
    const response = await api.post("/log/", symptomData);
    return response.data;
};

export const classifySymptoms = async (symptomData) => {
    await initCSRF();
    const response = await api.post("/classify/", symptomData);
    return response.data;
};

export const getHistory = async () => {
    const response = await api.get("/history/");
    return response.data;
};

export const downloadReport = (resultId) => {
    return `${API_BASE_URL}/report/${resultId}/`;
};

/* ==========================================
   BAYMAX CHAT
========================================== */
export const processText = async (text, conversationHistory, currentData) => {
    await initCSRF();
    const response = await api.post("/text/", {
        text,
        conversation_history: conversationHistory,
        current_data: currentData,
    });
    return response.data;
};

/* ==========================================
   PERIOD TRACKING
========================================== */
export const logCycle = async (cycleData) => {
    await initCSRF();
    const response = await api.post("/cycle/log/", cycleData);
    return response.data;
};

export const listCycles = async (limit = 10) => {
    const response = await api.get(`/cycle/list/?limit=${limit}`);
    return response.data;
};

export const predictCycle = async () => {
    const response = await api.get("/cycle/predict/");
    return response.data;
};

export const deleteCycle = async (cycleId) => {
    await initCSRF();
    const response = await api.post(`/cycle/delete/${cycleId}/`);
    return response.data;
};

/* ==========================================
   KNOWLEDGE BASE
========================================== */
export const listArticles = async (category = null) => {
    let url = "/articles/";
    if (category) url += `?category=${category}`;
    const response = await api.get(url);
    return response.data;
};

export const getArticle = async (articleId) => {
    const response = await api.get(`/articles/${articleId}/`);
    return response.data;
};

/* ==========================================
   AI INSIGHTS
========================================== */
export const getCycleInsight = async () => {
    const res = await api.get("/insights/cycle-aware/");
    return res.data;
};

export default api;
