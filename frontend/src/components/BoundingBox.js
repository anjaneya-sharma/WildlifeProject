import React, { useCallback, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import './styles.css';

// Convert from center coordinates (YOLO) to top-left coordinates (React)
const centerToTopLeft = (x_center, y_center, width, height) => ({
  x: x_center - width/2,
  y: y_center - height/2,
  width,
  height
});

// Convert from top-left coordinates (React) to center coordinates (YOLO)
const topLeftToCenter = (x_topleft, y_topleft, width, height) => ({
  x: x_topleft + width/2,
  y: y_topleft + height/2,
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
  const [box, setBox] = useState(() => {
    if (initialBox) {
      // Convert incoming YOLO coordinates to React coordinates
      const reactCoords = centerToTopLeft(
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

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');

  const boxRef = useRef(null);
  const selectRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastUpdateRef = useRef(box);

  const handleMouseDown = useCallback((e) => {
    if (e.target === boxRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const { clientX, clientY } = e;
      const { left, top } = boxRef.current.getBoundingClientRect();
      startPosRef.current = { x: clientX - left, y: clientY - top };
      setIsDragging(true);
      setIsInteractingWithBoundingBox(true);
    }
  }, [setIsInteractingWithBoundingBox]);

  const handleResizeStart = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX, clientY } = e;
    startPosRef.current = { x: clientX, y: clientY };
    setIsResizing(true);
    setResizeHandle(handle);
    setIsInteractingWithBoundingBox(true);
  }, [setIsInteractingWithBoundingBox]);

  const handleMouseMove = useCallback((e) => {
    e.preventDefault();
    if (isDragging) {
      const { clientX, clientY } = e;
      const { left, top } = boxRef.current.parentElement.getBoundingClientRect();

      let newX = clientX - left - startPosRef.current.x;
      let newY = clientY - top - startPosRef.current.y;

      newX = Math.max(0, Math.min(newX, imageWidth - box.width));
      newY = Math.max(0, Math.min(newY, imageHeight - box.height));

      setBox(prevBox => ({ ...prevBox, x: newX, y: newY }));
    } else if (isResizing) {
      const { clientX, clientY } = e;
      const dx = clientX - startPosRef.current.x;
      const dy = clientY - startPosRef.current.y;
      startPosRef.current = { x: clientX, y: clientY };

      setBox(prevBox => {
        let newBox = { ...prevBox };

        switch (resizeHandle) {
          case 'nw':
            newBox.x += dx;
            newBox.y += dy;
            newBox.width -= dx;
            newBox.height -= dy;
            break;
          case 'ne':
            newBox.y += dy;
            newBox.width += dx;
            newBox.height -= dy;
            break;
          case 'sw':
            newBox.x += dx;
            newBox.width -= dx;
            newBox.height += dy;
            break;
          case 'se':
            newBox.width += dx;
            newBox.height += dy;
            break;
          default:
            break;
        }

        newBox.x = Math.max(0, Math.min(newBox.x, imageWidth - newBox.width));
        newBox.y = Math.max(0, Math.min(newBox.y, imageHeight - newBox.height));
        newBox.width = Math.max(100, Math.min(newBox.width, imageWidth - newBox.x));
        newBox.height = Math.max(30, Math.min(newBox.height, imageHeight - newBox.y));

        return newBox;
      });
    }
  }, [isDragging, isResizing, resizeHandle, imageWidth, imageHeight, box.width]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
    setTimeout(() => setIsInteractingWithBoundingBox(false), 50);
  }, [setIsInteractingWithBoundingBox]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (
      box.x !== lastUpdateRef.current.x ||
      box.y !== lastUpdateRef.current.y ||
      box.width !== lastUpdateRef.current.width ||
      box.height !== lastUpdateRef.current.height ||
      box.category !== lastUpdateRef.current.category
    ) {
      lastUpdateRef.current = box;
      // Convert React coordinates to YOLO coordinates before sending update
      const yoloCoords = topLeftToCenter(box.x, box.y, box.width, box.height);
      onBoxChange({
        ...yoloCoords,
        category: box.category
      });
    }
  }, [box, onBoxChange]);

  const handleCategoryChange = useCallback((selectedOption) => {
    setBox(prevBox => ({ ...prevBox, category: selectedOption.value }));
  }, []);

  return (
    <div
      ref={boxRef}
      className="bounding-box"
      style={{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <Select
        ref={selectRef}
        options={classList
          .filter(cls => cls.trim().toLowerCase() !== 'all')
          .map(cls => ({ value: cls, label: cls.replace(/-/g, ' ') }))}
        value={{ value: box.category, label: box.category.replace(/-/g, ' ') }}
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
            onRemove();
          }}
        >
          ×
        </button>
      )}
      <div className="resize-handle nw" onMouseDown={(e) => handleResizeStart(e, 'nw')}></div>
      <div className="resize-handle ne" onMouseDown={(e) => handleResizeStart(e, 'ne')}></div>
      <div className="resize-handle sw" onMouseDown={(e) => handleResizeStart(e, 'sw')}></div>
      <div className="resize-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')}></div>
    </div>
  );
};

export default BoundingBox;