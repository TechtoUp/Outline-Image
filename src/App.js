import React, { useState, useEffect } from 'react';
import './App.css';
import ImageUploader from './ImageUploader';
import HumanDetector from './HumanDetector';
import BackgroundRemover from './BackgroundRemover';
import OutlineDrawer from './OutlineDrawer';
import { SketchPicker } from 'react-color';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [originalImageElement, setOriginalImageElement] = useState(null);
  const [segmentationData, setSegmentationData] = useState(null);
  const [subjectOnlyCanvas, setSubjectOnlyCanvas] = useState(null);
  const [finalOutlinedCanvas, setFinalOutlinedCanvas] = useState(null);

  const [outlineColor, setOutlineColor] = useState('#ffffff');
  const [outlineThickness, setOutlineThickness] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleImageUpload = (imageSrc, imageElement) => {
    setUploadedImage(imageSrc);
    setOriginalImageElement(imageElement);
    setSegmentationData(null);
    setSubjectOnlyCanvas(null);
    setFinalOutlinedCanvas(null);
    setShowColorPicker(false);
    if (imageSrc) {
      console.log('App: Image uploaded.');
    } else {
      console.log('App: Image cleared.');
    }
  };

  const handleSegmentationComplete = (segmentation) => {
    if (segmentation) {
      setSegmentationData(segmentation);
    } else {
      setSegmentationData(null);
      setSubjectOnlyCanvas(null);
      setFinalOutlinedCanvas(null);
    }
  };

  const handleBackgroundRemovalComplete = (canvas) => {
    if (canvas) {
      setSubjectOnlyCanvas(canvas);
    } else {
      setSubjectOnlyCanvas(null);
      setFinalOutlinedCanvas(null);
    }
  };

  const handleOutlineComplete = (canvas) => {
    if (canvas) {
      setFinalOutlinedCanvas(canvas);
    } else {
      setFinalOutlinedCanvas(null);
    }
  };

  const handleColorChange = (color) => {
    setOutlineColor(color.hex);
  };

  const handleDownload = () => {
    if (finalOutlinedCanvas) {
      const dataURL = finalOutlinedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'outline.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('App: Image download initiated.');
    } else {
      console.log('App: No final image to download.');
      alert('No image processed yet. Please upload an image and process it first.');
    }
  };

  useEffect(() => {
    const displayArea = document.getElementById('final-display-area');
    if (displayArea && finalOutlinedCanvas) {
      displayArea.innerHTML = '';

      const title = document.createElement('p');
      title.textContent = "Final Output:";
      displayArea.appendChild(title);

      // Clone the canvas for display to avoid issues if the original is modified
      // or if this useEffect runs multiple times with the same canvas instance.
      const displayCanvas = document.createElement('canvas');
      displayCanvas.width = finalOutlinedCanvas.width;
      displayCanvas.height = finalOutlinedCanvas.height;
      const displayCtx = displayCanvas.getContext('2d');
      displayCtx.drawImage(finalOutlinedCanvas, 0, 0);

      const displayWidth = 300;
      displayCanvas.style.width = `${displayWidth}px`;
      displayCanvas.style.height = `${(finalOutlinedCanvas.height / finalOutlinedCanvas.width) * displayWidth}px`;
      displayCanvas.style.border = '1px solid purple';
      displayCanvas.style.backgroundColor = '#333'; // Dark bg to see white outline
      displayArea.appendChild(displayCanvas);

    } else if (displayArea) {
      displayArea.innerHTML = '';
    }
  }, [finalOutlinedCanvas]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Background Remover & Outliner</h1>
      </header>
      <main>
        <ImageUploader onImageUpload={handleImageUpload} />

        {originalImageElement && (
          <HumanDetector
            imageElement={originalImageElement}
            onSegmentation={handleSegmentationComplete}
          />
        )}

        {originalImageElement && segmentationData && (
          <BackgroundRemover
            imageElement={originalImageElement}
            segmentation={segmentationData}
            onProcessedCanvas={handleBackgroundRemovalComplete}
          />
        )}

        {subjectOnlyCanvas && (
          <div className="controls-panel">
            <h3>Outline Settings</h3>
            <div className="control-item">
              <label htmlFor="outlineThickness">Outline Thickness (0-10px): </label>
              <input
                type="number"
                id="outlineThickness"
                value={outlineThickness}
                min="0"
                max="10"
                onChange={(e) => setOutlineThickness(parseInt(e.target.value, 10))}
              />
              px
            </div>
            <div className="control-item">
              <label>Outline Color: </label>
              <div
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  backgroundColor: outlineColor,
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                  verticalAlign: 'middle',
                  marginLeft: '10px'
                }}
              />
              {showColorPicker && (
                <div style={{ position: 'absolute', zIndex: 2 }}>
                  <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} onClick={() => setShowColorPicker(false)}/>
                  <SketchPicker color={outlineColor} onChangeComplete={handleColorChange} />
                </div>
              )}
            </div>
          </div>
        )}

        {subjectOnlyCanvas && (
          <OutlineDrawer
            subjectCanvas={subjectOnlyCanvas}
            outlineColor={outlineColor}
            outlineThickness={outlineThickness}
            onOutlinedCanvas={handleOutlineComplete}
          />
        )}

        <div id="final-display-area" style={{marginTop: '20px'}}>
          {/* Final outlined canvas will be appended here by useEffect */}
        </div>

        <div id="final-display-area" style={{marginTop: '20px'}}>
          {/* Final outlined canvas will be appended here by useEffect */}
        </div>

        <button
          onClick={handleDownload}
          className="download-button"
          disabled={!finalOutlinedCanvas}
        >
          Download Image (outline.png)
        </button>

      </main>
    </div>
  );
}

export default App;
