import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api', // Use your backend's URL
    withCredentials: true // Important for handling cookies
});

export default api;