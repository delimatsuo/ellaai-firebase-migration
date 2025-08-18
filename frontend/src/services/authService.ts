import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface LoginResponse {
  success: boolean;
  user: {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    photoURL?: string;
  };
  sessionExpires: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

class AuthService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 10000,
  });

  constructor() {
    // Add response interceptor to handle authentication errors
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - redirect to login
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async createSession(idToken: string): Promise<LoginResponse> {
    try {
      const response = await this.axios.post('/auth/login', {
        idToken,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to create session:', error);
      
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Failed to create session');
      }
      
      throw new Error('Network error occurred');
    }
  }

  async clearSession(): Promise<void> {
    try {
      await this.axios.post('/auth/logout');
    } catch (error) {
      console.error('Failed to clear session:', error);
      // Don't throw error for logout failures
    }
  }

  async verifySession(): Promise<boolean> {
    try {
      const response = await this.axios.get('/auth/verify');
      return response.data.valid || false;
    } catch (error) {
      console.error('Failed to verify session:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.axios.get('/auth/verify');
      return response.data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      // This would typically refresh the ID token
      // For Firebase, this is handled automatically by the SDK
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }
}

export const authService = new AuthService();