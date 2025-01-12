import axiosInstance from './api.js';
import { handleImageApiError, handleRawImageError } from '../utils/error.js';

export const getImageUrl = (imageId) => 
  `${process.env.REACT_APP_API_BASE_URL}/images/ObjectDetection/?image_id=${imageId}`;

export const getImages = async (classId = 'All') => {
  try {
    const url = classId === 'All' 
      ? '/images/ObjectDetection/'
      : `/images/ObjectDetection/?class_id=${parseInt(classId, 10)}`;

    console.log('Fetching images from:', url);
    const response = await axiosInstance.get(url);
    console.log('Raw response:', response.data);
    
    const imageIds = response.data.image_ids || [];
    console.log('Processed imageIds:', imageIds);

    const images = imageIds.map(id => ({
      id,
      filename: `Image ${id}`,
      src: getImageUrl(id)
    }));
    console.log('Transformed images:', images);
    return images;
  } catch (error) {
    handleImageApiError(error);
    return [];
  }
};

export const getImageBoxes = async (imageId) => {
  try {
    const response = await axiosInstance.get(`/images/ObjectDetection/${imageId}/bounding-boxes`);
    const boxes = response.data.boxes.map(boxArray => ({
      id: boxArray[0],
      image_id: boxArray[1],
      class_id: boxArray[2],
      x: boxArray[3],
      y: boxArray[4],
      width: boxArray[5],
      height: boxArray[6],
      confidence: boxArray[7],
      created_at: boxArray[8]
    }));
    return { boxes };
  } catch (error) {
    handleImageApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while fetching processed images');
  }
};

export const saveImageBoxes = async (imageId, boxes) => {
  try {
    const response = await axiosInstance.post(`/images/ObjectDetection/${imageId}/bounding-boxes`, boxes);
    return response;
  } catch (error) {
    handleImageApiError(error);
    throw new Error(error.response?.data?.detail || 'Network error while posting annotations');
  }
};