// Real API client for Django backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
      if (refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem('refresh_token', refreshToken);
      }
    } else {
      this.clearAuth();
    }
  }

  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Redirect to login page if we're not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  // HTTP method shortcuts
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token refresh on 401
      if (response.status === 401 && this.refreshToken && !endpoint.includes('token/refresh/')) {
        try {
          const refreshResponse = await this.post('/auth/token/refresh/', {
            refresh: this.refreshToken
          });
          
          if (refreshResponse.access) {
            this.setToken(refreshResponse.access, refreshResponse.refresh);
            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${this.token}`;
            response = await fetch(url, {
              ...options,
              headers,
            });
          } else {
            this.clearAuth();
            throw new Error('Session expired. Please log in again.');
          }
        } catch (refreshError) {
          this.clearAuth();
          throw new Error('Session expired. Please log in again.');
        }
        // This allows the app to work without authentication
        this.setToken(null);
        
        // For endpoints that can work without auth, return null instead of throwing
        if (endpoint.includes('/me') || endpoint.includes('/profile')) {
          return null;
        }
        
        // For other endpoints, throw error
        throw new Error('Unauthorized');
      }

      return this.handleResponse(response);
    } catch (error) {
      // Don't log 401 errors for optional endpoints
      if (error.message === 'Unauthorized' && endpoint.includes('/me')) {
        return null;
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      // Try to parse error message from response
      let errorMessage = 'Request failed';
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          errorMessage = data.detail || data.message || data.error || JSON.stringify(data);
        } catch (e) {
          errorMessage = `Request failed with status ${response.status}`;
        }
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // For 204 No Content or other non-JSON responses
    if (response.status === 204) {
      return null;
    }
    
    return response;
  }

  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      const data = await response.json();
      if (response.ok && data.access) {
        this.setToken(data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  // Authentication methods
  async login(username, password) {
    const response = await this.request('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.access) {
      this.setToken(response.access);
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }
    }
    return response;
  }

  async register(userData) {
    const response = await this.request('/users/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.access) {
      this.setToken(response.access);
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }
    }
    return response;
  }

  async me() {
    try {
      return await this.request('/users/me/');
    } catch (error) {
      // Return null if unauthorized (no token)
      if (error.message === 'Unauthorized' || !this.token) {
        return null;
      }
      throw error;
    }
  }

  async getUserProfile() {
    return this.request('/users/profile/');
  }

  // Business methods
  async getBusinesses() {
    return this.request('/users/businesses/');
  }

  async getBusiness(id) {
    return this.request(`/users/businesses/${id}/`);
  }

  async createBusiness(businessData) {
    return this.request('/users/businesses/', {
      method: 'POST',
      body: JSON.stringify(businessData),
    });
  }

  // Transaction methods
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/finance/transactions/${queryString ? '?' + queryString : ''}`);
  }

  async getTransaction(id) {
    return this.request(`/finance/transactions/${id}/`);
  }

  async createTransaction(transactionData) {
    return this.request('/finance/transactions/', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async getTransactionAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/finance/transactions/analytics/${queryString ? '?' + queryString : ''}`);
  }

  // Invoice methods
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/finance/invoices/${queryString ? '?' + queryString : ''}`);
  }
  
  // Supplier methods
  async getSuppliers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/finance/suppliers/${queryString ? '?' + queryString : ''}`);
  }
  
  async getSupplier(id) {
    return this.request(`/finance/suppliers/${id}/`);
  }
  
  async createSupplier(supplierData) {
    return this.request('/finance/suppliers/', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  }
  
  async updateSupplier(id, supplierData) {
    return this.request(`/finance/suppliers/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  }
  
  async deleteSupplier(id) {
    return this.request(`/finance/suppliers/${id}/`, { method: 'DELETE' });
  }

  async getInvoice(id) {
    return this.request(`/finance/invoices/${id}/`);
  }

  async createInvoice(invoiceData) {
    return this.request('/finance/invoices/', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  // Dashboard methods
  async getDashboardData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/finance/dashboard/${queryString ? '?' + queryString : ''}`);
  }

  // Financial summary
  async getFinancialSummary(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/finance/transactions/summary/${queryString ? '?' + queryString : ''}`);
  }

  // Cash flow forecasts
  async getCashFlowForecasts() {
    return this.request('/finance/cash-flows/');
  }

  // Credit scores
  async getCreditScores() {
    return this.request('/finance/credit-scores/');
  }

  async calculateCreditScore(businessId) {
    return this.request('/finance/credit-scores/calculate_score/', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId }),
    });
  }

  // Memberships
  async listMemberships(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/users/memberships/${qs ? '?' + qs : ''}`);
  }

  async createMembership(data) {
    return this.request('/users/memberships/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMembership(id, data) {
    return this.request(`/users/memberships/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMembership(id) {
    return this.request(`/users/memberships/${id}/`, { method: 'DELETE' });
  }

  // Invitations
  async listInvitations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/users/invitations/${qs ? '?' + qs : ''}`);
  }

  async createInvitation(data) {
    return this.request('/users/invitations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin user management
  async adminResetPassword(userId, newPassword) {
    return this.request(`/users/admin/users/${userId}/password/`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  async adminUpdateUserRole(userId, role) {
    return this.request(`/users/admin/users/${userId}/role/`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async adminRegisterUser(userData) {
    return this.request('/users/admin/users/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getAdminStats() {
    return this.request('/users/admin/stats/');
  }

  async getAllUsers() {
    return this.request('/users/admin/users/');
  }

  // Super Admin Business Management methods
  async getAllBusinesses() {
    return this.request('/users/admin/businesses/all/');
  }

  async getAllAdmins() {
    return this.request('/users/admin/admins/all/');
  }

  async createBusiness(businessData) {
    return this.request('/users/admin/businesses/create/', {
      method: 'POST',
      body: JSON.stringify(businessData),
    });
  }

  async assignBusinessToAdmin(businessId, adminId) {
    return this.request('/users/admin/businesses/assign/', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, admin_id: adminId }),
    });
  }

  async getBusinessDetail(businessId) {
    return this.request(`/users/admin/businesses/${businessId}/`);
  }

  async getAvailableStaff() {
    return this.request('/users/admin/staff/available/');
  }

  async assignStaffToBusiness(businessId, userIds) {
    return this.request('/users/admin/businesses/assign-staff/', {
      method: 'POST',
      body: JSON.stringify({ business_id: businessId, user_ids: userIds }),
    });
  }

  // Business Registration methods
  async registerBusiness(registrationData) {
    return this.request('/users/business-registration/', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  async checkRegistrationStatus(email) {
    return this.request(`/users/business-registration/status/${encodeURIComponent(email)}/`);
  }

  async listPendingRegistrations() {
    return this.request('/users/admin/pending-registrations/');
  }

  async approveRegistration(registrationId) {
    return this.request(`/users/admin/approve-registration/${registrationId}/`, {
      method: 'POST',
    });
  }

  async rejectRegistration(registrationId, rejectionReason) {
    return this.request(`/users/admin/reject-registration/${registrationId}/`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
  }

  // Voice conversation (for compatibility with existing code)
  async createVoiceConversation(data) {
    // This would typically go to a voice conversations endpoint
    // For now, we'll store it locally or use a mock
    return Promise.resolve({ id: Date.now(), ...data });
  }

  // File upload
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.baseURL}/users/upload-document/`;
    const headers = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      return this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Admin Analytics
  async getAdminAnalytics() {
    return this.request('/users/admin/analytics/');
  }

  // Admin Settings
  async getAdminSettings() {
    return this.request('/users/admin/settings/');
  }

  async updateAdminSettings(settings) {
    return this.request('/users/admin/settings/update/', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Admin Security
  async getAdminSecurity() {
    return this.request('/users/admin/security/');
  }

  async getAdminSecurityActivity() {
    return this.request('/users/admin/security/activity/');
  }

  // Documents
  async listRegistrationDocuments() {
    return this.request('/users/admin/documents/');
  }

  // Individual Registration
  async approveIndividualRegistration(registrationId, data) {
    return this.request(`/users/admin/approve-individual-registration/${registrationId}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export default for compatibility
export default apiClient;

