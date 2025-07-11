import React, { useState, useEffect, useCallback } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

// Ensure TensorFlow.js backend is initialized
tf.ready().then(() => {
  console.log('TensorFlow.js backend initialized:', tf.getBackend());
});

const HumanDetector = ({ imageElement, onSegmentation }) => {
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Load BodyPix model
  useEffect(() => {
    if (!model && !loadingModel) {
      setLoadingModel(true);
      setError('');
      console.log('Loading BodyPix model...');
      bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75, // Using 0.75 for a balance of speed and accuracy
        quantBytes: 2      // Using 2 for a balance of speed and accuracy
      }).then(loadedModel => {
        setModel(loadedModel);
        setLoadingModel(false);
        console.log('BodyPix model loaded successfully.');
      }).catch(err => {
        console.error('Error loading BodyPix model:', err);
        setError('Failed to load AI model. Please try refreshing.');
        setLoadingModel(false);
      });
    }
  }, [model, loadingModel]);

  // Perform segmentation when model and image are ready
  const runSegmentation = useCallback(async () => {
    if (model && imageElement && !processing && !loadingModel) {
      setProcessing(true);
      setError('');
      console.log('Starting person segmentation...');
      try {
        // segmentPerson supports a single person, which aligns with the requirement.
        const segmentation = await model.segmentPerson(imageElement, {
          flipHorizontal: false,
          internalResolution: 'medium', // 'medium' for balance, 'low' for speed, 'high' for accuracy
          segmentationThreshold: 0.7, // Default is 0.7
          maxDetections: 1, // Optimize for a single subject
          scoreThreshold: 0.2 // Default is 0.2
        });

        if (segmentation && segmentation.data) {
          console.log('Segmentation successful:', segmentation);
          onSegmentation(segmentation);
        } else {
          console.log('No person detected or segmentation data is empty.');
          onSegmentation(null); // Notify parent if no one is detected
          setError('No person detected in the image.');
        }
      } catch (err) {
        console.error('Error during segmentation:', err);
        setError('Error processing image. Please try a different image.');
        onSegmentation(null);
      } finally {
        setProcessing(false);
      }
    } else if (!model && !loadingModel) {
        setError('AI Model not loaded yet.');
    } else if (!imageElement) {
        // This state is normal before an image is uploaded
        // setError('No image provided for detection.');
    }
  }, [model, imageElement, onSegmentation, processing, loadingModel]);

  // Effect to run segmentation automatically when imageElement changes
  useEffect(() => {
    if (imageElement && model) {
      runSegmentation();
    } else {
      // Clear previous error/segmentation if image is removed
      setError('');
      // onSegmentation(null); // Optionally clear segmentation if image is removed
    }
  }, [imageElement, model, runSegmentation]);

  if (loadingModel) {
    return <p>Loading AI model, please wait...</p>;
  }

  if (error) {
    return <p style={{ color: 'orange' }}>{error}</p>;
  }

  if (processing) {
    return <p>Detecting subject...</p>;
  }

  // Component doesn't render much itself, it primarily processes
  // and calls onSegmentation callback.
  // A button to manually trigger could be added if needed.
  return null;
};

export default HumanDetector;
