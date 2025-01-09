export const handleRawImageError = (error) => {
  console.error('RawImageApi Error:', error);
  // Additional handling specific to rawImageApi
  // e.g., show a notification to the user
};

export const handleImageApiError = (error) => {
  console.error('ImageApi Error:', error);
  // Additional handling specific to imageApi
  // e.g., retry the request or log to an external service
};

export const handleUploadApiError = (error) => {
  console.error('UploadApi Error:', error);
  // Additional handling specific to uploadApi
  // e.g., provide user feedback or rollback actions
};

export const logError = (...args) => {
  console.error(...args);
};