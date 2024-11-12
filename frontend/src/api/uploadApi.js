const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch('http://127.0.0.1:8000/upload/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const uploadFolders = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
    formData.append('folders', file.webkitRelativePath);
  });

  const response = await fetch('http://127.0.0.1:8000/upload-folders/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export { uploadFiles, uploadFolders };