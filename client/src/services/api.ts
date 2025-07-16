import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Types
export interface Bucket {
  id: number;
  name: string;
  type: 'short' | 'medium' | 'long';
  target_amount: number;
  current_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  bucket_id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description?: string;
  category?: string;
  date: string;
  created_at: string;
  bucket_name?: string;
  bucket_type?: string;
}

export interface FireSettings {
  id: number;
  current_age: number;
  target_fire_age: number;
  current_net_worth: number;
  target_net_worth: number;
  monthly_expenses: number;
  expected_return_rate: number;
  inflation_rate: number;
  withdrawal_rate: number;
  updated_at: string;
}

export interface FireProjection {
  current_net_worth: number;
  fire_number: number;
  required_monthly_contribution: number;
  months_to_fire: number;
  years_to_fire: number;
  fire_date: string;
  progress_percentage: number;
  projections: Array<{
    year: number;
    age: number;
    projected_net_worth: number;
    annual_contribution: number;
    fire_number: number;
    progress_percentage: number;
  }>;
}

export interface DashboardData {
  current_month: number;
  current_year: number;
  monthly_expenses: Array<{
    bucket_type: string;
    total_amount: number;
    transaction_count: number;
  }>;
  monthly_income: Array<{
    bucket_type: string;
    total_amount: number;
    transaction_count: number;
  }>;
  bucket_progress: Array<Bucket & { progress_percentage: number }>;
  recent_transactions: Transaction[];
  summary: {
    total_monthly_expenses: number;
    total_monthly_income: number;
    net_worth: number;
  };
}

// Bucket API
export const bucketApi = {
  getAll: () => api.get<Bucket[]>('/buckets'),
  getById: (id: number) => api.get<Bucket>(`/buckets/${id}`),
  create: (bucket: Omit<Bucket, 'id' | 'current_amount' | 'created_at' | 'updated_at'>) => 
    api.post<{ id: number; message: string }>('/buckets', bucket),
  update: (id: number, bucket: Partial<Bucket>) => 
    api.put<{ message: string }>(`/buckets/${id}`, bucket),
  delete: (id: number) => api.delete<{ message: string }>(`/buckets/${id}`),
  getByType: (type: 'short' | 'medium' | 'long') => 
    api.get<Bucket[]>(`/buckets/type/${type}`),
};

// Transaction API
export const transactionApi = {
  getAll: (params?: { bucket_id?: number; type?: string; limit?: number; offset?: number }) => 
    api.get<Transaction[]>('/transactions', { params }),
  getById: (id: number) => api.get<Transaction>(`/transactions/${id}`),
  create: (transaction: Omit<Transaction, 'id' | 'created_at' | 'bucket_name' | 'bucket_type'>) => 
    api.post<{ id: number; message: string }>('/transactions', transaction),
  update: (id: number, transaction: Partial<Transaction>) => 
    api.put<{ message: string }>(`/transactions/${id}`, transaction),
  delete: (id: number) => api.delete<{ message: string }>(`/transactions/${id}`),
  getByBucket: (bucketId: number, params?: { limit?: number; offset?: number }) => 
    api.get<Transaction[]>(`/transactions/bucket/${bucketId}`, { params }),
  getMonthly: (year: number, month: number) => 
    api.get<any[]>(`/transactions/monthly/${year}/${month}`),
  getCategories: () => api.get<string[]>('/transactions/categories/list'),
};

// FIRE API
export const fireApi = {
  getSettings: () => api.get<FireSettings>('/fire/settings'),
  updateSettings: (settings: Partial<FireSettings>) => 
    api.put<{ message: string }>('/fire/settings', settings),
  getProjection: () => api.get<FireProjection>('/fire/projection'),
  getProgress: () => api.get<any[]>('/fire/progress'),
  getFeasibility: () => api.get<any>('/fire/feasibility'),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => api.get<DashboardData>('/analytics/dashboard'),
  getMonthlyReport: (year: number, month: number) => 
    api.get<any>(`/analytics/monthly/${year}/${month}`),
  getYearlyReport: (year: number) => 
    api.get<any>(`/analytics/yearly/${year}`),
  getSpendingTrends: (months?: number) => 
    api.get<any[]>('/analytics/trends/spending', { params: { months } }),
  getCategoryBreakdown: (months?: number) => 
    api.get<any[]>('/analytics/categories/breakdown', { params: { months } }),
};

// Helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

export default api;