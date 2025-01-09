import React, { useCallback, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import './styles.css';

// Convert from center coordinates (YOLO) to top-left coordinates (React)
const convertCenterToTopLeft = (xCenter, yCenter, width, height) => ({
  x: xCenter - width / 2,
  y: yCenter - height / 2,
  width,
  height
});

// Convert from top-left coordinates (React) to center coordinates (YOLO)
const convertTopLeftToCenter = (xTopLeft, yTopLeft, width, height) => ({
  x: xTopLeft + width / 2,
  y: yTopLeft + height / 2,
  width,
  height
});

const BoundingBox = ({
  id,
  imageWidth,
  imageHeight,
  onBoxChange,
  initialBox = null,
  onRemove,
  showRemoveButton,
  setIsInteractingWithBoundingBox,
  classList,
}) => {
  const [boundingBox, setBoundingBox] = useState(() => {
    if (initialBox) {
      const reactCoords = convertCenterToTopLeft(
        initialBox.x,
        initialBox.y,
        initialBox.width,
        initialBox.height
      );
      return {
        ...reactCoords,
        category: initialBox.category || 'XYZ'
      };
    }
    return { x: 10, y: 10, width: 100, height: 100, category: 'XYZ' };
  });

  const [isDragging, setDragging] = useState(false);
  const [isResizing, setResizing] = useState(false);
  const [currentResizeHandle, setResizeHandle] = useState('');
  const [renderSize, setRenderSize] = useState({ width: imageWidth, height: imageHeight });

  const boxRef = useRef(null);
  const selectRef = useRef(null);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const lastBoxUpdateRef = useRef(boundingBox);

  const handleDragStart = useCallback((e) => {
    if (e.target === boxRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const { clientX, clientY } = e;
      const { left, top } = boxRef.current.getBoundingClientRect();
      startPositionRef.current = { x: clientX - left, y: clientY - top };
      console.log('Drag started at:', startPositionRef.current);
      setDragging(true);
      setIsInteractingWithBoundingBox(true);
    }
  }, [setIsInteractingWithBoundingBox]);

  const handleResizeInitiate = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX, clientY } = e;
    startPositionRef.current = { x: clientX, y: clientY };
    console.log(`Resize started on handle: ${handle} at`, startPositionRef.current);
    setResizing(true);
    setResizeHandle(handle);
    setIsInteractingWithBoundingBox(true);
  }, [setIsInteractingWithBoundingBox]);

  const handleMovement = useCallback((e) => {
    e.preventDefault();
    const scaleX = renderSize.width / imageWidth;
    const scaleY = renderSize.height / imageHeight;
    console.log('Mouse Move - ScaleX:', scaleX, 'ScaleY:', scaleY);
    console.log('Mouse Move - Render Size:', renderSize);
    console.log('Mouse Move - Image Size:', imageWidth, imageHeight);

    if (isDragging) {
      const { clientX, clientY } = e;
      const { left, top } = boxRef.current.parentElement.getBoundingClientRect();

      let newX = (clientX - left - startPositionRef.current.x) / scaleX;
      let newY = (clientY - top - startPositionRef.current.y) / scaleY;

      console.log('Dragging - Original X:', newX, 'Original Y:', newY);

      newX = Math.max(0, Math.min(newX, imageWidth - boundingBox.width));
      newY = Math.max(0, Math.min(newY, imageHeight - boundingBox.height));

      console.log('Dragging - Clamped X:', newX, 'Clamped Y:', newY);

      if (newX < 0 || newY < 0 || newX + boundingBox.width > imageWidth || newY + boundingBox.height > imageHeight) {
        console.warn('Bounding box is out of image bounds after drag:', { newX, newY, width: boundingBox.width, height: boundingBox.height });
      }

      setBoundingBox(prevBox => {
        const updatedBox = { ...prevBox, x: newX, y: newY };
        console.log('Box after Drag:', updatedBox);
        return updatedBox;
      });
    } else if (isResizing) {
      const { clientX, clientY } = e;
      const dx = (clientX - startPositionRef.current.x) / scaleX;
      const dy = (clientY - startPositionRef.current.y) / scaleY;
      console.log('Resizing - dx:', dx, 'dy:', dy);
      startPositionRef.current = { x: clientX, y: clientY };

      setBoundingBox(prevBox => {
        let updatedBox = { ...prevBox };
        console.log('Resizing - Initial Box:', updatedBox);

        switch (currentResizeHandle) {
          case 'nw':
            updatedBox.x += dx;
            updatedBox.y += dy;
            updatedBox.width -= dx;
            updatedBox.height -= dy;
            break;
          case 'ne':
            updatedBox.y += dy;
            updatedBox.width += dx;
            updatedBox.height -= dy;
            break;
          case 'sw':
            updatedBox.x += dx;
            updatedBox.width -= dx;
            updatedBox.height += dy;
            break;
          case 'se':
            updatedBox.width += dx;
            updatedBox.height += dy;
            break;
          default:
            break;
        }

        console.log('Resizing - Modified Box:', updatedBox);

        updatedBox.x = Math.max(0, Math.min(updatedBox.x, imageWidth - updatedBox.width));
        updatedBox.y = Math.max(0, Math.min(updatedBox.y, imageHeight - updatedBox.height));
        updatedBox.width = Math.max(100, Math.min(updatedBox.width, imageWidth - updatedBox.x));
        updatedBox.height = Math.max(30, Math.min(updatedBox.height, imageHeight - updatedBox.y));

        console.log('Resizing - Clamped Box:', updatedBox);

        if (updatedBox.x < 0 || updatedBox.y < 0 || updatedBox.x + updatedBox.width > imageWidth || updatedBox.y + updatedBox.height > imageHeight) {
          console.warn('Bounding box is out of image bounds after resize:', updatedBox);
        }

        console.log('Box after Resize:', updatedBox);

        return updatedBox;
      });
    }
  }, [isDragging, isResizing, currentResizeHandle, imageWidth, imageHeight, renderSize, boundingBox]);

  const handleMouseRelease = useCallback((e) => {
    e.preventDefault();
    console.log('Mouse Up - Dragging:', isDragging, 'Resizing:', isResizing);
    setDragging(false);
    setResizing(false);
    setTimeout(() => setIsInteractingWithBoundingBox(false), 50);
  }, [isDragging, isResizing, setIsInteractingWithBoundingBox]);

  useEffect(() => {
    if (isDragging || isResizing) {
      console.log('Adding mousemove and mouseup listeners');
      document.addEventListener('mousemove', handleMovement);
      document.addEventListener('mouseup', handleMouseRelease);
    }

    return () => {
      console.log('Removing mousemove and mouseup listeners');
      document.removeEventListener('mousemove', handleMovement);
      document.removeEventListener('mouseup', handleMouseRelease);
    };
  }, [isDragging, isResizing, handleMovement, handleMouseRelease]);

  useEffect(() => {
    if (
      boundingBox.x !== lastBoxUpdateRef.current.x ||
      boundingBox.y !== lastBoxUpdateRef.current.y ||
      boundingBox.width !== lastBoxUpdateRef.current.width ||
      boundingBox.height !== lastBoxUpdateRef.current.height ||
      boundingBox.category !== lastBoxUpdateRef.current.category
    ) {
      console.log('Box updated:', boundingBox);
      lastBoxUpdateRef.current = boundingBox;
      const yoloCoords = convertTopLeftToCenter(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
      onBoxChange({
        ...yoloCoords,
        category: boundingBox.category
      });
    }
  }, [boundingBox, onBoxChange]);

  const handleCategoryChange = useCallback((selectedOption) => {
    console.log('Category changed to:', selectedOption.value);
    setBoundingBox(prevBox => ({ ...prevBox, category: selectedOption.value }));
  }, []);

  useEffect(() => {
    const updateRenderSize = () => {
      if (boxRef.current && boxRef.current.parentElement) {
        const { width, height } = boxRef.current.parentElement.getBoundingClientRect();
        console.log('Rendered size updated:', width, height);
        setRenderSize({ width, height });

        if (Math.abs(width - imageWidth) > 1 || Math.abs(height - imageHeight) > 1) {
          console.warn('Rendered size differs from image size:', { renderWidth: width, renderHeight: height, imageWidth, imageHeight });
        }
      }
    };

    updateRenderSize();
    window.addEventListener('resize', updateRenderSize);
    return () => window.removeEventListener('resize', updateRenderSize);
  }, [imageWidth, imageHeight]);

  return (
    <div
      ref={boxRef}
      className="bounding-box"
      style={{
        left: `${(boundingBox.x * renderSize.width / imageWidth)}px`,
        top: `${(boundingBox.y * renderSize.height / imageHeight)}px`,
        width: `${boundingBox.width * renderSize.width / imageWidth}px`,
        height: `${boundingBox.height * renderSize.height / imageHeight}px`
      }}
      onMouseDown={handleDragStart}
    >
      <Select
        ref={selectRef}
        options={classList
          .filter(cls => cls.trim().toLowerCase() !== 'all')
          .map(cls => ({ value: cls, label: cls.replace(/-/g, ' ') }))}
        value={{ value: boundingBox.category, label: boundingBox.category.replace(/-/g, ' ') }}
        onChange={handleCategoryChange}
        className="category-select"
        classNamePrefix="select"
        isSearchable
        onMouseDown={e => e.stopPropagation()}
      />
      {showRemoveButton && (
        <button
          className="remove-button"
          onClick={(e) => {
            e.stopPropagation();
            console.log('Remove button clicked for box:', id);
            onRemove();
          }}
        >
          ×
        </button>
      )}
      <div className="resize-handle nw" onMouseDown={(e) => handleResizeInitiate(e, 'nw')}></div>
      <div className="resize-handle ne" onMouseDown={(e) => handleResizeInitiate(e, 'ne')}></div>
      <div className="resize-handle sw" onMouseDown={(e) => handleResizeInitiate(e, 'sw')}></div>
      <div className="resize-handle se" onMouseDown={(e) => handleResizeInitiate(e, 'se')}></div>
      {/* <div className="debug-info" style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(255,255,255,0.7)', padding: '5px', fontSize: '12px' }}>
        <p><strong>Box Position:</strong> x: {boundingBox.x.toFixed(2)}, y: {boundingBox.y.toFixed(2)}</p>
        <p><strong>Box Size:</strong> width: {boundingBox.width.toFixed(2)}, height: {boundingBox.height.toFixed(2)}</p>
        <p><strong>Image Size:</strong> width: {imageWidth}, height: {imageHeight}</p>
        <p><strong>Rendered Size:</strong> width: {renderSize.width.toFixed(2)}, height: {renderSize.height.toFixed(2)}</p>
        { (boundingBox.x < 0 || boundingBox.y < 0 || boundingBox.x + boundingBox.width > imageWidth || boundingBox.y + boundingBox.height > imageHeight) && (
          <p style={{ color: 'red' }}>Warning: Bounding box is out of image bounds!</p>
        )}
      </div> */}
    </div>
  );
};

export default BoundingBox;