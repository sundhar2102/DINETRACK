import { apiRequest } from './client';

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  googleLogin: (data) => apiRequest('/auth/google', { method: 'POST', body: data }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

export const restaurantApi = {
  getNearby: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    return apiRequest(`/restaurants/nearby?${searchParams.toString()}`);
  },
  getById: (id, lat, lng) => {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    return apiRequest(`/restaurants/${id}?${params.toString()}`);
  },
  update: (id, data) => apiRequest(`/restaurants/${id}`, { method: 'PATCH', body: data }),
  getWaitTime: (id, partySize = 2) => apiRequest(`/wait-time/${id}?partySize=${partySize}`),
  clearData: (id) => apiRequest(`/restaurants/${id}/clear-data`, { method: 'POST' }),
  create: (data) => apiRequest('/restaurants', { method: 'POST', body: data })
};

export const adminApi = {
  getOverview: () => apiRequest('/admin/overview'),
  getRestaurants: (status) => apiRequest(`/admin/restaurants${status ? `?status=${status}` : ''}`),
  getRevenueBreakdown: (timeframe = 'today') => apiRequest(`/admin/revenue?timeframe=${timeframe}`),
  getUsers: (role) => apiRequest(`/admin/users${role ? `?role=${role}` : ''}`),
  approveRestaurant: (id, notes) => apiRequest(`/admin/restaurants/${id}/approve`, { method: 'PATCH', body: { notes } }),
  rejectRestaurant: (id, reason) => apiRequest(`/admin/restaurants/${id}/reject`, { method: 'PATCH', body: { reason } })
};



export const tableApi = {
  getByRestaurant: (restaurantId) => apiRequest(`/tables/restaurant/${restaurantId}`),
  updateStatus: (tableId, status) => apiRequest(`/tables/${tableId}/status`, { method: 'PATCH', body: { status } }),
  create: (restaurantId, data) => apiRequest(`/tables/restaurant/${restaurantId}`, { method: 'POST', body: data }),
  delete: (tableId) => apiRequest(`/tables/${tableId}`, { method: 'DELETE' })
};

export const reservationApi = {
  create: (data) => apiRequest('/reservations', { method: 'POST', body: data }),
  getMy: () => apiRequest('/reservations/my'),
  getByRestaurant: (restaurantId, status) => apiRequest(`/reservations/restaurant/${restaurantId}${status ? `?status=${status}` : ''}`),
  updateStatus: (id, status) => apiRequest(`/reservations/${id}/status`, { method: 'PATCH', body: { status } })
};

export const orderApi = {
  create: (data) => apiRequest('/orders', { method: 'POST', body: data }),
  getById: (id) => apiRequest(`/orders/${id}`),
  getMy: () => apiRequest('/orders/my'),
  getByRestaurant: (restaurantId, status) => apiRequest(`/orders/restaurant/${restaurantId}${status ? `?status=${status}` : ''}`),
  updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  getPrepTiming: (data) => apiRequest('/wait-time/prep-timing', { method: 'POST', body: data })
};

export const waitlistApi = {
  join: (data) => apiRequest('/waitlist', { method: 'POST', body: data }),
  getByRestaurant: (restaurantId) => apiRequest(`/waitlist/restaurant/${restaurantId}`),
  updateStatus: (id, status) => apiRequest(`/waitlist/${id}/status`, { method: 'PATCH', body: { status } })
};

export const notificationApi = {
  getAll: () => apiRequest('/notifications'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' })
};

export const analyticsApi = {
  getStats: (restaurantId) => apiRequest(`/analytics/restaurant/${restaurantId}`)
};

export const menuApi = {
  getByRestaurant: (restaurantId) => apiRequest(`/menu/${restaurantId}`),
  createItem: (data) => apiRequest('/menu/items', { method: 'POST', body: data }),
  updateItem: (id, data) => apiRequest(`/menu/items/${id}`, { method: 'PATCH', body: data }),
  deleteItem: (id) => apiRequest(`/menu/items/${id}`, { method: 'DELETE' })
};

export const reviewApi = {
  getByRestaurant: (restaurantId) => apiRequest(`/reviews/restaurant/${restaurantId}`),
  create: (data) => apiRequest('/reviews', { method: 'POST', body: data }),
  reply: (reviewId, replyText) => apiRequest(`/reviews/${reviewId}/reply`, { method: 'POST', body: { replyText } })
};

export const offersApi = {
  getAll: () => apiRequest('/offers'),
  getByRestaurant: (restaurantId) => apiRequest(`/offers/restaurant/${restaurantId}`),
  getActive: (restaurantId) => apiRequest(`/offers/restaurant/${restaurantId}/active`),
  validate: (restaurantId, code, orderAmount) => apiRequest('/offers/validate', { method: 'POST', body: { restaurantId, code, orderAmount } }),
  create: (restaurantId, data) => apiRequest(`/offers/restaurant/${restaurantId}`, { method: 'POST', body: data }),
  toggle: (id) => apiRequest(`/offers/${id}/toggle`, { method: 'PATCH' }),
  delete: (id) => apiRequest(`/offers/${id}`, { method: 'DELETE' })
};

export const inventoryApi = {
  getByRestaurant: (restaurantId) => apiRequest(`/inventory/restaurant/${restaurantId}`),
  getLowStock: (restaurantId) => apiRequest(`/inventory/restaurant/${restaurantId}/low-stock`),
  create: (restaurantId, data) => apiRequest(`/inventory/restaurant/${restaurantId}`, { method: 'POST', body: data }),
  updateStock: (id, quantity, action = 'SET') => apiRequest(`/inventory/${id}/stock`, { method: 'PATCH', body: { quantity, action } }),
  delete: (id) => apiRequest(`/inventory/${id}`, { method: 'DELETE' })
};

export const crmApi = {
  getCustomers: (restaurantId, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.filter) searchParams.append('filter', params.filter);
    return apiRequest(`/crm/restaurant/${restaurantId}?${searchParams.toString()}`);
  },
  getCustomerDetails: (restaurantId, userId) => apiRequest(`/crm/restaurant/${restaurantId}/customer/${userId}`)
};

export const eventsApi = {
  getAll: () => apiRequest('/events'),
  getByRestaurant: (restaurantId) => apiRequest(`/events/restaurant/${restaurantId}`),
  getUpcoming: (restaurantId) => apiRequest(`/events/restaurant/${restaurantId}/upcoming`),
  create: (restaurantId, data) => apiRequest(`/events/restaurant/${restaurantId}`, { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/events/${id}`, { method: 'DELETE' })
};

export const reportsApi = {
  getSales: (restaurantId, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    return apiRequest(`/reports/restaurant/${restaurantId}/sales?${searchParams.toString()}`);
  },
  getTableUtilization: (restaurantId) => apiRequest(`/reports/restaurant/${restaurantId}/tables`),
  getCsvDownloadUrl: (restaurantId) => `/api/reports/restaurant/${restaurantId}/export/sales-csv`
};

export const settingsApi = {
  get: (restaurantId) => apiRequest(`/settings/restaurant/${restaurantId}`),
  update: (restaurantId, data) => apiRequest(`/settings/restaurant/${restaurantId}`, { method: 'PATCH', body: data }),
  getLogs: (restaurantId) => apiRequest(`/settings/restaurant/${restaurantId}/logs`)
};

export const supportApi = {
  getTickets: (restaurantId) => apiRequest(`/support/restaurant/${restaurantId}`),
  createTicket: (restaurantId, data) => apiRequest(`/support/restaurant/${restaurantId}`, { method: 'POST', body: data })
};

export const staffApi = {
  getByRestaurant: (restaurantId) => apiRequest(`/staff/restaurant/${restaurantId}`),
  add: (restaurantId, data) => apiRequest(`/staff/restaurant/${restaurantId}`, { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/staff/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => apiRequest(`/staff/${id}`, { method: 'DELETE' })
};
