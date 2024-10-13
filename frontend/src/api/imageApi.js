import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchImages = () => {
  return axios.get(`${API_BASE_URL}/images`)
    .then(response => response.data.images)
    .catch(error => {
      console.error('Error fetching images:', error);
      throw error;
    });
};