import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchRawImages = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/raw-images`);
    return response.data;
  } catch (error) {
    console.error('Error fetching raw images:', error);
    throw error;
  }
};