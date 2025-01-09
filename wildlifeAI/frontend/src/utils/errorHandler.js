// wildlifeAI/frontend/src/utils/errorHandler.js
export const handleApiError = (error, context) => {
    console.error(`Error in ${context}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('Config:', error.config);
    throw error;
  };