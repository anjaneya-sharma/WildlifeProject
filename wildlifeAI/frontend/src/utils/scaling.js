export const FIXED_IMAGE_WIDTH = 1280;
export const FIXED_IMAGE_HEIGHT = 720;

// Convert (x, y, width, height) from original to fixed size
export const scaleToFixed = (x, y, width, height, originalWidth, originalHeight) => {
  const scaleX = FIXED_IMAGE_WIDTH / originalWidth;
  const scaleY = FIXED_IMAGE_HEIGHT / originalHeight;

  return {
    x: x * scaleX,
    y: y * scaleY,
    width: width * scaleX,
    height: height * scaleY
  };
};

// Convert (x, y, width, height) from fixed size to original
export const scaleToOriginal = (x, y, width, height, originalWidth, originalHeight) => {
  const scaleX = originalWidth / FIXED_IMAGE_WIDTH;
  const scaleY = originalHeight / FIXED_IMAGE_HEIGHT;

  return {
    x: x * scaleX,
    y: y * scaleY,
    width: width * scaleX,
    height: height * scaleY
  };
};