import axiosInstance from './api.js';
import { handleUploadApiError } from '../utils/error.js';

export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    console.log('Axios Base URL:', axiosInstance.defaults.baseURL);
    const response = await axiosInstance.post('/images/ObjectDetection/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });


    
    const uploadedIds = response.data?.uploaded_image_ids || [];
    if (!Array.isArray(uploadedIds)) {
      throw new Error('Server response uploaded_image_ids is not an array');
    }
    return uploadedIds;
  } catch (error) {
    handleUploadApiError(error);
    return [];
  }
};

export const uploadZipFolder = async (zipFile) => {
  const formData = new FormData();
  formData.append('folder', zipFile);

  try {
    const response = await axiosInstance.post('/folders/ObjectDetection', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    const uploadedIds = response.data?.uploaded_image_ids || [];
    if (!Array.isArray(uploadedIds)) {
      throw new Error('Server response uploaded_image_ids is not an array');
    }
    return uploadedIds;
  } catch (error) {
    handleUploadApiError(error);
    return [];
  }
};