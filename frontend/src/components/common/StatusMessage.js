import React from 'react';

const StatusMessage = ({ status, error }) => {
  if (!status && !error) return null;

  const messageClass = `status-message ${status || 'error'} show`;
  const message = error || (status === 'upload-success' ? 'Upload successful!' : 'Upload failed!');

  return (
    <div className={messageClass}>
      {message}
    </div>
  );
};

export default StatusMessage;