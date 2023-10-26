import axios from 'axios';

export const axiosInstance = axios.create({ maxRedirects: 0 });

axiosInstance.interceptors.response.use(null, (error) => {
  if (error.response) {
    return error.response;
  }

  return Promise.reject(error);
});
