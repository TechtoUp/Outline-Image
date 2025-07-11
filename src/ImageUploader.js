import React, { useState, useCallback } from 'react';

const ImageUploader = ({ onImageUpload }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = useCallback((event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      processFile(file);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [onImageUpload]);

  const processFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, or WEBP image.');
      setImageSrc(null);
      if (onImageUpload) onImageUpload(null, null); // Clear any previous image
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImageSrc = e.target.result;
      setImageSrc(newImageSrc);
      if (onImageUpload) {
        const img = new Image();
        img.onload = () => {
          onImageUpload(newImageSrc, img);
        }
        img.onerror = () => {
          setError('Failed to load image.');
          if (onImageUpload) onImageUpload(null, null);
        }
        img.src = newImageSrc;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      style={{
        border: '2px dashed #ccc',
        padding: '20px',
        textAlign: 'center',
        width: '300px',
        margin: '20px auto'
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'block', margin: '10px auto' }}
        id="fileInput"
      />
      <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
        Drag & drop an image here, or click to select a file.
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {imageSrc && (
        <div style={{ marginTop: '20px' }}>
          <p>Preview:</p>
          <img
            src={imageSrc}
            alt="Uploaded preview"
            style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
