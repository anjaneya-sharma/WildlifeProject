import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchImages = async (className) => {
  let url = `${API_BASE_URL}/images`;
  if (className && className !== 'All') {
    url += `?class_name=${className}`;
  }
  
  try {
    const response = await axios.get(url);
    return response.data.images.map(img => img.path);
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
};