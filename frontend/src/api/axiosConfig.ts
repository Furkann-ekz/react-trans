import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Axios Interceptor: Her istek gönderilmeden önce araya girer
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Eğer token varsa, Authorization başlığını ekle
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // İstek hatası olursa, hatayı geri döndür
    return Promise.reject(error);
  }
);

export default apiClient;