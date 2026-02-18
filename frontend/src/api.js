/**
 * API client for Django backend
 * Uses Token Authentication for Cross-Domain support
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/* ===============================
   INTERCEPTOR: ADD TOKEN
================================== */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ovasense_token");
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

/* ===============================
   AUTH APIs
================================== */
export const loginUser = async (data) => {
    const res = await api.post("/auth/login/", data);
    if (res.data.token) {
        localStorage.setItem("ovasense_token", res.data.token);
    }
    return res.data;
};

export const logoutUser = async () => {
    await api.post("/auth/logout/");
    localStorage.removeItem("ovasense_token");
};

export const getMe = async () => {
    try {
        const res = await api.get("/auth/me/");
        return res.data;
    } catch (err) {
        return { authenticated: false };
    }
};

export const registerUser = async (data) => {
    const res = await api.post("/auth/register/", data);
    if (res.data.token) {
        localStorage.setItem("ovasense_token", res.data.token);
    }
    return res.data;
};
/* ===============================
   PCOS & OTHER APIs
================================== */
export const logSymptoms = async (data) => (await api.post("/log/", data)).data;
export const classifySymptoms = async (data) => (await api.post("/classify/", data)).data;
export const getHistory = async () => (await api.get("/history/")).data;
export const downloadReport = (id) => `${API_BASE_URL}/report/${id}/`;
export const processText = async (text, history, current) =>
    (await api.post("/text/", { text, conversation_history: history, current_data: current })).data;

export const logCycle = async (data) => (await api.post("/cycle/log/", data)).data;
export const listCycles = async (limit = 10) => (await api.get(`/cycle/list/?limit=${limit}`)).data;
export const predictCycle = async () => (await api.get("/cycle/predict/")).data;
export const deleteCycle = async (id) => (await api.post(`/cycle/delete/${id}/`)).data;

export const listArticles = async (cat = null) =>
    (await api.get(cat ? `/articles/?category=${cat}` : "/articles/")).data;
export const getArticle = async (id) => (await api.get(`/articles/${id}/`)).data;
export const getCycleInsight = async () => (await api.get("/insights/cycle-aware/")).data;

export default api;
