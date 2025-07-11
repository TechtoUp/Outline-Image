import React, { useEffect, useRef } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';

const BackgroundRemover = ({ imageElement, segmentation, onProcessedCanvas }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (imageElement && segmentation && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Ensure canvas dimensions match the image
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;

      console.log('BackgroundRemover: Drawing segmented person. Canvas size:', canvas.width, canvas.height);

      // Create a temporary canvas to draw the mask
      const tempMaskCanvas = document.createElement('canvas');
      tempMaskCanvas.width = canvas.width;
      tempMaskCanvas.height = canvas.height;
      const tempMaskCtx = tempMaskCanvas.getContext('2d');

      // Create ImageData from segmentation data
      // segmentation.data is a Uint8Array where 1 means part of person, 0 otherwise.
      const imageData = tempMaskCtx.createImageData(segmentation.width, segmentation.height);
      const data = imageData.data;
      for (let i = 0; i < segmentation.data.length; i++) {
        const n = i * 4;
        data[n] = 0;     // R
        data[n + 1] = 0; // G
        data[n + 2] = 0; // B
        data[n + 3] = segmentation.data[i] === 1 ? 255 : 0; // Alpha: 255 for person, 0 for background
      }
      tempMaskCtx.putImageData(imageData, 0, 0);

      // Clear the main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw original image
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

      // Apply the mask: 'destination-in' keeps parts of image where mask is opaque
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(tempMaskCanvas, 0, 0, canvas.width, canvas.height);

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      console.log('BackgroundRemover: Person drawn with transparent background.');
      if (onProcessedCanvas) {
        onProcessedCanvas(canvas); // Pass the canvas itself
      }

    } else if (canvasRef.current && !segmentation) {
      // Clear canvas if no segmentation or image is removed
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      console.log('BackgroundRemover: Canvas cleared due to no segmentation.');
      if (onProcessedCanvas) {
        onProcessedCanvas(null); // Notify that canvas is cleared
      }
    }
  }, [imageElement, segmentation, onProcessedCanvas]);

  // Initially hide the canvas, App.js will decide when to show it or its content.
  // Or, it can be used as an offscreen canvas for processing.
  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none', /* 'block' for debugging */ margin: '20px auto', border: '1px solid lightgray' }}
      data-testid="background-remover-canvas"
    />
  );
};

export default BackgroundRemover;
