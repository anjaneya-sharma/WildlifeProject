import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchImages = async (className = 'All') => {
  const url = `${API_BASE_URL}/detection-images/${encodeURIComponent(className)}`;

  console.log(`Fetching images from URL: ${url}`);

  try {
    const response = await axios.get(url);
    console.log('Fetched images:', response.data);
    const images = response.data.map(id => ({
        id: id,
        filename: `Image ${id}`,
        src: `${API_BASE_URL}/raw-images/${id}`
    }));
    return images;
  } catch (error) {
    if (error.response) {
      // not 2xx
      console.error('Error fetching images:', error.response.status, error.response.data);
    } else if (error.request) {
      // no response received
      console.error('Error fetching images: No response received', error.request);
    } else {
      // hopefully never
      console.error('Error fetching images:', error.message);
    }
    throw error;
  }
};
