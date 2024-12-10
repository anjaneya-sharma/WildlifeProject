import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const uploadFiles = async (files) => {
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
    throw new Error(error.response?.data?.detail || 'Network error while uploading');
  }
};

const uploadFolders = async (zipFile) => {
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
    throw new Error(error.response?.data?.detail || 'Network error while uploading');
  }
};

export { uploadFiles, uploadFolders };
