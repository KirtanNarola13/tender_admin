import axios from 'axios';

export const FILE_BASE_URL = 'http://localhost:3000';
// export const FILE_BASE_URL = 'https://tender-api.reliablesolution.in';

const api = axios.create({
    baseURL: `${FILE_BASE_URL}/api`,
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
        }

        return Promise.reject(error);
    }
);

export const getImageUrl = (path) => {
    if (!path) return '';

    // 1. Handle new relative paths
    if (path.startsWith('/')) {
        return `${FILE_BASE_URL}${path}`;
    }

    // 2. Handle legacy or broken ngrok/localhost absolute paths
    // If it points to an old ngrok instance, force it to local
    if (path.includes('ngrok') || path.includes('localhost')) {
        try {
            const url = new URL(path);
            // Keep strictly the path part '/uploads/...'
            return `${FILE_BASE_URL}${url.pathname}`;
        } catch (e) {
            return path;
        }
    }

    return path;
};

export default api;
