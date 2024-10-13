// BoundingBox.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BoundingBox.css';

const BoundingBox = ({ imageWidth, imageHeight, onBoxChange, initialBox = null }) => {
  const [box, setBox] = useState(() => {
    if (initialBox) {
      return {
        x: initialBox.x * imageWidth,
        y: initialBox.y * imageHeight,
        width: Math.max(initialBox.width * imageWidth, 100),
        height: Math.max(initialBox.height * imageHeight, 30),
        category: initialBox.category || 'XYZ'
      };
    }
    return { x: 10, y: 10, width: 100, height: 100, category: 'XYZ' };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    const { left, top } = boxRef.current.getBoundingClientRect();
    startPosRef.current = { x: clientX - left, y: clientY - top };
    setIsDragging(true);
  }, []);

  const handleResizeStart = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX, clientY } = e;
    startPosRef.current = { x: clientX, y: clientY };
    setIsResizing(true);
    setResizeHandle(handle);
  }, []);

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
  }, [isDragging, isResizing, resizeHandle, box.width, box.height, imageWidth, imageHeight]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setBox(prevBox => ({ ...prevBox, category: e.target.value }));
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const normalizedBox = {
      x: box.x / imageWidth,
      y: box.y / imageHeight,
      width: box.width / imageWidth,
      height: box.height / imageHeight,
      category: box.category
    };
    onBoxChange(normalizedBox);
  }, [box, imageWidth, imageHeight, onBoxChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        inputRef.current.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bounding-box-container"
      style={{ width: imageWidth, height: imageHeight }}
      onMouseDown={(e) => e.preventDefault()}>
      <div
        ref={boxRef}
        className="bounding-box"
        style={{
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <input
          ref={inputRef}
          type="text"
          className="category-input"
          value={box.category}
          onChange={handleCategoryChange}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        <div className="resize-handle nw" onMouseDown={(e) => handleResizeStart(e, 'nw')}></div>
        <div className="resize-handle ne" onMouseDown={(e) => handleResizeStart(e, 'ne')}></div>
        <div className="resize-handle sw" onMouseDown={(e) => handleResizeStart(e, 'sw')}></div>
        <div className="resize-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')}></div>
      </div>
    </div>
  );
};

export default BoundingBox;