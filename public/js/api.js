// API configuration and utilities
const API_BASE_URL = window.location.origin;

// API client class
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication methods
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async register(email, password, tipoUsuario) {
        const response = await this.post('/auth/register', { 
            email, 
            password, 
            tipoUsuario 
        });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async logout() {
        this.setToken(null);
        return { success: true };
    }

    // Professionals methods
    async searchProfessionals(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        
        const endpoint = `/professionals${params.toString() ? '?' + params.toString() : ''}`;
        return this.get(endpoint);
    }

    async getProfessional(id) {
        return this.get(`/professionals/${id}`);
    }

    async getFeaturedProfessionals() {
        return this.get('/professionals/featured');
    }

    async getProfessionalStats() {
        return this.get('/professionals/stats');
    }

    // Reviews methods
    async createReview(reviewData) {
        return this.post('/reviews', reviewData);
    }

    async getMyReviews(page = 1, limit = 10) {
        return this.get(`/reviews/my-reviews?page=${page}&limit=${limit}`);
    }

    async getReceivedReviews(page = 1, limit = 10) {
        return this.get(`/reviews/received?page=${page}&limit=${limit}`);
    }

    async getPendingReviews() {
        return this.get('/reviews/pending');
    }

    async getRecentReviews(limit = 5) {
        return this.get(`/reviews/recent?limit=${limit}`);
    }

    async getReviewStats() {
        return this.get('/reviews/stats');
    }

    // Connections methods
    async createConnection(connectionData) {
        return this.post('/connections', connectionData);
    }

    async getConnections(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        
        const endpoint = `/connections${params.toString() ? '?' + params.toString() : ''}`;
        return this.get(endpoint);
    }

    async getConnection(id) {
        return this.get(`/connections/${id}`);
    }

    async updateConnectionStatus(id, status, additionalData = {}) {
        return this.put(`/connections/${id}/status`, { 
            estado: status, 
            ...additionalData 
        });
    }

    async sendMessage(connectionId, message) {
        return this.post(`/connections/${connectionId}/messages`, { mensaje: message });
    }

    async processPayment(connectionId, paymentData) {
        return this.post(`/connections/${connectionId}/payment`, paymentData);
    }

    async getConnectionStats() {
        return this.get('/connections/stats');
    }

    // User profile methods
    async getUserProfile() {
        return this.get('/users/profile');
    }

    async updateProfile(profileData) {
        return this.put('/users/profile', profileData);
    }

    async updateAvailability(disponible) {
        return this.put('/users/availability', { disponible });
    }

    async updateSettings(settings) {
        return this.put('/users/settings', { configuracion: settings });
    }

    async uploadPhoto(file) {
        // Simulate photo upload
        return this.post('/users/upload-photo', { file });
    }

    // Zones and services methods
    async getZones(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        
        const endpoint = `/zonas${params.toString() ? '?' + params.toString() : ''}`;
        return this.get(endpoint);
    }

    async getOficios(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        
        const endpoint = `/oficios${params.toString() ? '?' + params.toString() : ''}`;
        return this.get(endpoint);
    }

    async getOficiosCategorias() {
        return this.get('/oficios/categorias');
    }

    async getPopularZones() {
        return this.get('/zonas/populares');
    }

    async getPopularOficios() {
        return this.get('/oficios/populares');
    }
}

// Create global API client instance
const api = new ApiClient();

// Export for use in other files
window.api = api;