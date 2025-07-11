import React, { useEffect, useRef, useState } from 'react';

const OutlineDrawer = ({
    subjectCanvas, // Canvas with subject on transparent background
    outlineColor = '#ffffff', // Default white
    outlineThickness = 2, // Default 2px
    onOutlinedCanvas // Callback with the final canvas
}) => {
  const finalCanvasRef = useRef(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (subjectCanvas && finalCanvasRef.current && outlineThickness > 0) {
      setStatus('Processing outline...');
      const finalCanvas = finalCanvasRef.current;
      const finalCtx = finalCanvas.getContext('2d');

      finalCanvas.width = subjectCanvas.width;
      finalCanvas.height = subjectCanvas.height;

      // Step 1: Create a temporary canvas for edge detection from the alpha channel
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = subjectCanvas.width;
      tempCanvas.height = subjectCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Draw the subject (already on transparent bg) to the temp canvas
      tempCtx.drawImage(subjectCanvas, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const { data, width, height } = imageData;

      // Step 2: Edge detection (simple version: check alpha of neighboring pixels)
      // This will be an approximation of an outline. More sophisticated methods exist (e.g., Sobel).
      const edgeMask = new Uint8Array(width * height); // 1 if edge, 0 otherwise

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const alpha = data[i + 3];

          if (alpha > 0) { // If current pixel is part of the subject
            let isEdge = false;
            // Check neighbors (top, bottom, left, right)
            const neighbors = [
              { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
              { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
            ];

            for (const n of neighbors) {
              const nx = x + n.dx;
              const ny = y + n.dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = (ny * width + nx) * 4;
                if (data[ni + 3] === 0) { // Neighbor is transparent
                  isEdge = true;
                  break;
                }
              } else {
                // Pixel is at the border of the canvas and is part of subject, consider it an edge
                isEdge = true;
                break;
              }
            }
            if (isEdge) {
              edgeMask[y * width + x] = 1;
            }
          }
        }
      }

      // Step 3: Draw the outline on the final canvas
      finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Option A: Draw outline behind subject
      // finalCtx.fillStyle = outlineColor;
      // finalCtx.strokeStyle = outlineColor;
      // finalCtx.lineWidth = outlineThickness * 2; // Effectively thickness on each side
      // finalCtx.lineJoin = 'round';
      // finalCtx.lineCap = 'round';
      // for (let y = 0; y < height; y++) {
      //   for (let x = 0; x < width; x++) {
      //     if (edgeMask[y * width + x] === 1) {
      //       finalCtx.fillRect(x - outlineThickness, y - outlineThickness, outlineThickness * 2, outlineThickness * 2);
      //     }
      //   }
      // }
      // finalCtx.drawImage(subjectCanvas, 0, 0);


      // Option B: Draw subject, then draw outline "around" it by dilating the edge mask
      // This is generally preferred for a clean outline that doesn't overlap the subject too much.

      // First, draw the subject itself
      finalCtx.drawImage(subjectCanvas, 0, 0);

      // Then, draw the outline pixels.
      // For a thicker outline, we can draw multiple offset versions of the edge or use a "glow" effect.
      // A simpler way for thickness: iterate through edge pixels and draw a small shape (rect/circle).
      finalCtx.fillStyle = outlineColor;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (edgeMask[y * width + x] === 1) {
            // To make the outline appear on the "outside" of the subject,
            // we draw it first, then the subject on top, but this requires
            // the subject to be drawn with an offset or the outline to be "thicker"
            // and then masked.
            // For simplicity here, drawing a filled rectangle for each edge point
            // will make the outline appear on both sides of the true edge.
            // A more robust way is to use canvas stroke operations on a path,
            // but generating that path from the mask is complex.

            // Draw a small rectangle for each edge point to create thickness
            // This effectively expands the edge point.
             finalCtx.fillRect(x - Math.floor(outlineThickness / 2), y - Math.floor(outlineThickness / 2), outlineThickness, outlineThickness);
          }
        }
      }

      // To ensure the subject is on top of the outline (if outline pixels accidentally overlap subject area):
      // This is a common technique: draw outline, then subject on top.
      // We need to make the outline "larger" than the subject for it to be visible.
      // This can be done by drawing the subject, then stroking its silhouette.
      // The current edgeMask is for pixels *at* the boundary.

      // Let's refine:
      // 1. Create a silhouette canvas (black subject on transparent)
      const silhouetteCanvas = document.createElement('canvas');
      silhouetteCanvas.width = subjectCanvas.width;
      silhouetteCanvas.height = subjectCanvas.height;
      const silCtx = silhouetteCanvas.getContext('2d');
      silCtx.drawImage(subjectCanvas, 0, 0);
      silCtx.globalCompositeOperation = 'source-in';
      silCtx.fillStyle = 'black'; // Color doesn't matter much, just need alpha
      silCtx.fillRect(0, 0, silhouetteCanvas.width, silhouetteCanvas.height);
      silCtx.globalCompositeOperation = 'source-over';

      // 2. Draw this silhouette multiple times, offset, in the outline color, onto the final canvas
      finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height); // Clear previous attempts
      finalCtx.fillStyle = outlineColor;

      const offsets = [];
      for (let dx = -outlineThickness; dx <= outlineThickness; dx++) {
        for (let dy = -outlineThickness; dy <= outlineThickness; dy++) {
          // Make it a circle/diamond shape for offsets to look better than a square
          if (dx*dx + dy*dy <= outlineThickness*outlineThickness) {
             if (dx !== 0 || dy !== 0) { // Don't draw center pixel yet
                offsets.push({dx, dy});
             }
          }
        }
      }
      // For a 1px outline, just the direct neighbors
      if (outlineThickness === 1) {
        offsets.length = 0; // Clear previous
        offsets.push({dx: -1, dy: 0});
        offsets.push({dx: 1, dy: 0});
        offsets.push({dx: 0, dy: -1});
        offsets.push({dx: 0, dy: 1});
        // Optional diagonals for 1px to make it more solid
        // offsets.push({dx: -1, dy: -1}); offsets.push({dx: 1, dy: -1});
        // offsets.push({dx: -1, dy: 1}); offsets.push({dx: 1, dy: 1});
      }


      offsets.forEach(offset => {
        finalCtx.drawImage(silhouetteCanvas, offset.dx, offset.dy);
      });

      // 3. Draw the original subject on top
      finalCtx.drawImage(subjectCanvas, 0, 0);


      setStatus('Outline complete.');
      if (onOutlinedCanvas) {
        onOutlinedCanvas(finalCanvas);
      }
    } else if (finalCanvasRef.current && (!subjectCanvas || outlineThickness <= 0)) {
      // Clear canvas if no subject or no outline needed
      const finalCanvas = finalCanvasRef.current;
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
      // If there's a subjectCanvas but no outline, draw just the subject
      if (subjectCanvas && outlineThickness <= 0) {
        finalCtx.drawImage(subjectCanvas, 0, 0);
         if (onOutlinedCanvas) onOutlinedCanvas(finalCanvas);
      } else {
         if (onOutlinedCanvas) onOutlinedCanvas(null);
      }
      setStatus(subjectCanvas ? 'No outline (thickness is zero or less).' : 'Waiting for subject image...');
    }
  }, [subjectCanvas, outlineColor, outlineThickness, onOutlinedCanvas]);

  return (
    <div style={{textAlign: 'center'}}>
      <p>{status}</p>
      {/* The final canvas is not necessarily displayed here directly by this component.
          App.js will manage its display or use. It's kept here for reference during development.
          It should be hidden in final product if App.js handles display elsewhere.
      */}
      <canvas
        ref={finalCanvasRef}
        style={{ display: 'none', /* 'block' for debugging */ margin: '10px auto', border: '1px dashed blue' }}
        data-testid="outline-drawer-canvas"
      />
    </div>
  );
};

export default OutlineDrawer;
