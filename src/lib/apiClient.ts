import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  async sendToN8n(data: any): Promise<AxiosResponse> {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      throw new Error('N8N_WEBHOOK_URL no está configurada');
    }
    return axios.post(n8nUrl, data);
  }
}

export const apiClient = new ApiClient();

export interface ReservationPayload {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  time: string;
  guests: number;
  duration: string;
  extras?: string[];
  paymentMethod: string;
  message?: string;
  totalPrice: number;
}

export async function createReservation(data: ReservationPayload) {
  return apiClient.post('/webhook-reserva', data);
}

export async function getReservation(id: string) {
  return apiClient.get(`/reservations/${id}`);
}

export async function updateReservation(id: string, data: Partial<ReservationPayload>) {
  return apiClient.put(`/reservations/${id}`, data);
}

export async function cancelReservation(id: string) {
  return apiClient.delete(`/reservations/${id}`);
}
