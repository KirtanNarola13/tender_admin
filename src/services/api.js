import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor for Logging
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();
        console.error(`[API Error] ${method} ${url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response && error.response.status === 500) {
            console.error('Critical Server Error (500):', error.response.data);
            // Optionally trigger a UI toast/notification here if you had one
        }

        return Promise.reject(error);
    }
);

export default api;
