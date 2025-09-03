import axios from "axios";

export const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepta erros de resposta (ex: token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ⛔ Evita o fluxo de refresh na rota de login
    if (originalRequest.url.includes("/")) {
      return Promise.reject(error);
    }

    // Se o status for 401 e ainda não tentamos o refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      // Se não existir refreshToken, não faz nada, só rejeita o erro
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const res = await axios.get(`${apiUrl}/auth/refresh`, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const newAccessToken = res.data.access_token;
        const newRefreshToken = res.data.refresh_token;

        // Atualiza os tokens
        localStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("refresh_token", newRefreshToken);

        // Reenvia a requisição original com o novo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, apenas limpa os tokens e não recarrega
        localStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
