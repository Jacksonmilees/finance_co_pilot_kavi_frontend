import { apiClient } from '@/lib/apiClient';

// Auth API
export const authApi = {
  login: (credentials) => apiClient.post('/auth/token/', credentials),
  refreshToken: (refreshToken) => apiClient.post('/auth/token/refresh/', { refresh: refreshToken }),
  getProfile: () => apiClient.get('/users/me/'),
};

// Invoices API
export const invoiceApi = {
  getAll: (params = {}) => apiClient.get('/finance/invoices/', { params }),
  getById: (id) => apiClient.get(`/finance/invoices/${id}/`),
  create: (data) => apiClient.post('/finance/invoices/', data),
  update: (id, data) => apiClient.put(`/finance/invoices/${id}/`, data),
  delete: (id) => apiClient.delete(`/finance/invoices/${id}/`),
  sendReminder: (id) => apiClient.post(`/finance/invoices/${id}/send-reminder/`),
};

// Transactions API
export const transactionApi = {
  getAll: (params = {}) => apiClient.get('/finance/transactions/', { params }),
  getById: (id) => apiClient.get(`/finance/transactions/${id}/`),
  create: (data) => apiClient.post('/finance/transactions/', data),
  update: (id, data) => apiClient.put(`/finance/transactions/${id}/`, data),
  delete: (id) => apiClient.delete(`/finance/transactions/${id}/`),
  getByDateRange: (startDate, endDate) => 
    apiClient.get(`/finance/transactions/?start_date=${startDate}&end_date=${endDate}`),
};

// Credit API
export const creditApi = {
  getScores: () => apiClient.get('/finance/credit-scores/'),
  getScore: (id) => apiClient.get(`/finance/credit-scores/${id}/`),
  calculateScore: (businessId) => 
    apiClient.post('/finance/credit-scores/calculate/', { business_id: businessId }),
};

// Cash Flow API
export const cashFlowApi = {
  getForecasts: () => apiClient.get('/finance/forecasts/'),
  getProjections: (params = {}) => apiClient.get('/finance/cash-flows/projections/', { params }),
  createForecast: (data) => apiClient.post('/finance/forecasts/', data),
  updateForecast: (id, data) => apiClient.put(`/finance/forecasts/${id}/`, data),
};

// Contacts API (Suppliers/Clients)
export const contactApi = {
  getAll: (type = '') => apiClient.get(`/finance/contacts/${type ? `?type=${type}` : ''}`),
  getById: (id) => apiClient.get(`/finance/contacts/${id}/`),
  create: (data) => apiClient.post('/finance/contacts/', data),
  update: (id, data) => apiClient.put(`/finance/contacts/${id}/`, data),
  delete: (id) => apiClient.delete(`/finance/contacts/${id}/`),
};

// AI Insights API
export const aiApi = {
  getInsights: () => apiClient.get('/finance/ai/insights/'),
  generateReport: (params) => apiClient.post('/finance/ai/generate-report/', params),
  getRecommendations: () => apiClient.get('/finance/ai/recommendations/'),
};

// Alerts API
export const alertApi = {
  getAll: () => apiClient.get('/finance/alerts/'),
  markAsRead: (id) => apiClient.post(`/finance/alerts/${id}/read/`),
  getUnreadCount: () => apiClient.get('/finance/alerts/unread-count/'),
};

// Dashboard API
export const dashboardApi = {
  getOverview: () => apiClient.get('/finance/dashboard/overview/'),
  getRecentActivity: () => apiClient.get('/finance/dashboard/recent-activity/'),
  getFinancialSummary: (params = {}) => 
    apiClient.get('/finance/dashboard/financial-summary/', { params }),
};

// Notifications API
export const notificationApi = {
  getAll: (params = {}) => apiClient.get('/core/notifications/', { params }),
  getUnreadCount: () => apiClient.get('/core/notifications/unread-count/'),
  markAsRead: (id) => apiClient.post(`/core/notifications/${id}/read/`),
  markAllAsRead: () => apiClient.post('/core/notifications/mark-all-read/'),
  delete: (id) => apiClient.delete(`/core/notifications/${id}/delete/`),
  create: (data) => apiClient.post('/core/notifications/create/', data),
};

// M-Pesa API
export const mpesaApi = {
  initiatePayment: (data) => apiClient.post('/finance/mpesa/initiate/', data),
  getPayments: (params = {}) => apiClient.get('/finance/mpesa/payments/', { params }),
  getPaymentStatus: (id) => apiClient.get(`/finance/mpesa/payments/${id}/`),
};
