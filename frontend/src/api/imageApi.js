import axios from 'axios';
import { handleImageApiError, handleRawImageError } from '../utils/error.js';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const getRawImageUrl = (imageId) => `${API_BASE_URL}/raw-images/${imageId}`;

export const fetchImages = async (className = 'All') => {
  const url = `${API_BASE_URL}/detection-images/${encodeURIComponent(className)}`;
  console.log(`Fetching images from URL: ${url}`);
  try {
    const response = await axios.get(url);
    console.log('Fetched images:', response.data);
    const images = response.data.map(id => ({
      id: id,
      filename: `Image ${id}`,
      src: getRawImageUrl(id)
    }));
    return images;
  } catch (error) {
    handleImageApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while fetching images');
  }
};

export const fetchRawImages = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/raw-images`);
    return response.data;
  } catch (error) {
    handleRawImageError(error);
    throw error;
  }
};

export const fetchProcessedImages = async (imageId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/processed-images/${imageId}`);
    return response.data;
  } catch (error) {
    handleImageApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while fetching processed images');
  }
};

export const postAnnotations = async (imageId, corrections) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/annotations/${imageId}`, corrections, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response;
  } catch (error) {
    handleImageApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while posting annotations');
  }
};