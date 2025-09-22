import apiClient from './axiosConfig';

export async function loginUser(email: string, password: string) {
  const response = await apiClient.post('/login', { email, password });
  return response.data;
}

export async function registerUser(email: string, password: string, name: string) {
  const response = await apiClient.post('/register', { email, password, name });
  return response.data;
}