import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (firstName: string, lastName: string, email: string, password: string) => 
    api.post('/auth/register', { firstName, lastName, email, password }),
};

// Store API
export const storeAPI = {
  getAll: () => 
    api.get('/stores'),
  
  getById: (id: string) => 
    api.get(`/stores/${id}`),
  
  create: (storeData: any) => 
    api.post('/stores', storeData),
  
  update: (id: string, storeData: any) => 
    api.put(`/stores/${id}`, storeData),
  
  delete: (id: string) => 
    api.delete(`/stores/${id}`),
};

// Report API
export const reportAPI = {
  getByStore: (storeId: string, startDate?: string, endDate?: string) => {
    let url = `/reports/store/${storeId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return api.get(url);
  },
  
  getById: (id: string) => 
    api.get(`/reports/${id}`),
  
  createOrUpdate: (reportData: any) => 
    api.post('/reports', reportData),
  
  delete: (id: string) => 
    api.delete(`/reports/${id}`),
};

// Lottery API
export const lotteryAPI = {
  // Games
  getAllGames: () => 
    api.get('/lottery/games'),
  
  createGame: (gameData: any) => 
    api.post('/lottery/games', gameData),
  
  // Inventory
  getAllInventory: () => 
    api.get('/lottery/inventory'),
  
  createInventory: (inventoryData: any) => 
    api.post('/lottery/inventory', inventoryData),
  
  updateInventoryStatus: (id: string, status: string) => 
    api.put(`/lottery/inventory/${id}/status`, { status }),
  
  // Tickets
  getAllTickets: (startDate?: string, endDate?: string) => {
    let url = '/lottery/tickets';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return api.get(url);
  },
  
  scanTicket: (ticketData: any) => 
    api.post('/lottery/tickets/scan', ticketData),
};

// User API
export const userAPI = {
  getAll: () => 
    api.get('/users'),
  
  getById: (id: string) => 
    api.get(`/users/${id}`),
  
  create: (userData: any) => 
    api.post('/users', userData),
  
  update: (id: string, userData: any) => 
    api.put(`/users/${id}`, userData),
  
  delete: (id: string) => 
    api.delete(`/users/${id}`),
  
  assignStore: (userId: string, storeId: string | null, removeStoreId?: string) => 
    api.post(`/users/${userId}/assign-store${storeId === null && removeStoreId ? `?removeStoreId=${removeStoreId}` : ''}`, { storeId }),
};

// Audit API
export const auditAPI = {
  getAll: (filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    actionTypeId?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return api.get(`/audit-logs${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getById: (id: string) => 
    api.get(`/audit-logs/${id}`),

  create: (data: {
    userId?: string;
    entityType: string;
    entityId?: string;
    actionTypeId: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
  }) => 
    api.post('/audit-logs', data)
};

// Lottery API functions
export const lotteryApi = {
  // Get lottery games
  getGames: async (): Promise<LotteryGame[]> => {
    const response = await api.get('/lottery/games');
    return response.data;
  },

  // Get lottery books
  getBooks: async (params?: { status?: string }): Promise<LotteryBook[]> => {
    const response = await api.get('/lottery/books', { params });
    return response.data;
  },

  // Activate a lottery book
  activateBook: async (bookId: string): Promise<LotteryBook> => {
    const response = await api.post(`/lottery/books/${bookId}/activate`);
    return response.data;
  },

  // Return a lottery book
  returnBook: async (bookId: string): Promise<LotteryBook> => {
    const response = await api.post(`/lottery/books/${bookId}/return`);
    return response.data;
  },

  // Get scanned tickets
  getScannedTickets: async (date: string): Promise<ScannedTicket[]> => {
    const response = await api.get('/lottery/tickets/scanned', { params: { date } });
    return response.data;
  },

  // Scan a ticket
  scanTicket: async (ticketData: {
    gameId: string;
    bookNumber: string;
    ticketNumber: string;
    currentTicket: string;
  }): Promise<ScannedTicket> => {
    const response = await api.post('/lottery/tickets/scan', ticketData);
    return response.data;
  },

  // Get lottery data for a specific date
  getLotteryData: async (date: string): Promise<LotteryData> => {
    const response = await api.get('/lottery/data', { params: { date } });
    return response.data;
  },

  // Save lottery data
  saveLotteryData: async (data: LotteryData): Promise<LotteryData> => {
    const response = await api.post('/lottery/data', data);
    return response.data;
  },
};

export default api; 