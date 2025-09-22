import apiClient from './axiosConfig';

// Belirli bir kullanıcının halka açık profilini getirir
export async function getUserProfile(userId: string) {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
}

// Belirli bir kullanıcının maç geçmişini getirir
export async function getMatchHistory(userId: string) {
  const response = await apiClient.get(`/users/${userId}/matches`);
  return response.data;
}

// Mevcut (giriş yapmış) kullanıcının profilini getirir
export async function getCurrentUserProfile() {
  const response = await apiClient.get('/profile');
  return response.data;
}

// Mevcut kullanıcının profilini günceller
export async function updateUserProfile(data: { name: string }) {
  const response = await apiClient.patch('/profile', data);
  return response.data;
}

// Mevcut kullanıcının şifresini değiştirir
export async function changePassword(passwordData: { currentPassword: string, newPassword: string }) {
  const response = await apiClient.post('/profile/change-password', passwordData);
  return response.data;
}