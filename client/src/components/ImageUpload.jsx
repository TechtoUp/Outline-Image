import { useState, useRef } from 'react';

const ImageUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Placeholder upload handler — will be wired in Step 3
  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setResult(data.cutout || data.filePath);
    } catch (err) {
      console.error(err);
      alert('Error uploading image');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div
        className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 object-contain"
          />
        ) : (
          <p className="text-gray-500 text-center">
            Drag & drop an image here, or click to select
          </p>
        )}
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {preview && (
        <button
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleUpload}
        >
          Upload & Remove Background
        </button>
      )}
      {result && (
        <div className="mt-6 text-center">
          <h3 className="mb-2 font-semibold">Cutout Preview</h3>
          <img src={result} alt="Cutout" className="max-h-64 mx-auto object-contain border" />
          <a
            href={result}
            download
            className="inline-block mt-2 text-blue-600 underline"
          >
            Download PNG
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;