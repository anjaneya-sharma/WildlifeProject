import axios from 'axios';
import { handleUploadApiError } from '../utils/error.js';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const uploadFiles = async (files) => {
  const formData = new FormData();
  formData.append('file', files[0]);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload/raw-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    handleUploadApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while uploading');
  }
};

export const uploadFolders = async (zipFile) => {
  const formData = new FormData();
  formData.append('folder', zipFile);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload/raw-images-folder`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    handleUploadApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while uploading folders');
  }
};