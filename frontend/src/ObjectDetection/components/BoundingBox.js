import React, { useCallback, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
// import './styles.css';
import styles from './styles.module.css'

const convertCenterToTopLeft = (xCenter, yCenter, width, height) => ({
  x: xCenter - width / 2,
  y: yCenter - height / 2,
  width,
  height
});

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
  const filteredClassList = classList.filter(cls => cls.name.trim().toLowerCase() !== 'all');

  const [boundingBox, setBoundingBox] = useState(() => {
    if (initialBox) {
      const reactCoords = convertCenterToTopLeft(
        initialBox.x,
        initialBox.y,
        initialBox.width,
        initialBox.height
      );
      const initialCategory = initialBox.class_id !== undefined && filteredClassList.some(cls => String(cls.id) === String(initialBox.class_id))
        ? initialBox.class_id
        : (filteredClassList[0]?.id || null);
      return {
        ...reactCoords,
        category: initialCategory
      };
    }
    const defaultCategory = filteredClassList[0]?.id || null;
    return { x: 10, y: 10, width: 100, height: 100, category: defaultCategory };
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
      setDragging(true);
      setIsInteractingWithBoundingBox(true);
    }
  }, [setIsInteractingWithBoundingBox]);

  const handleResizeInitiate = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX, clientY } = e;
    startPositionRef.current = { x: clientX, y: clientY };
    setResizing(true);
    setResizeHandle(handle);
    setIsInteractingWithBoundingBox(true);
  }, [setIsInteractingWithBoundingBox]);

  const handleMovement = useCallback((e) => {
    e.preventDefault();
    const scaleX = renderSize.width / imageWidth;
    const scaleY = renderSize.height / imageHeight;

    if (isDragging) {
      const { clientX, clientY } = e;
      const { left, top } = boxRef.current.parentElement.getBoundingClientRect();

      let newX = (clientX - left - startPositionRef.current.x) / scaleX;
      let newY = (clientY - top - startPositionRef.current.y) / scaleY;

      newX = Math.max(0, Math.min(newX, imageWidth - boundingBox.width));
      newY = Math.max(0, Math.min(newY, imageHeight - boundingBox.height));

      setBoundingBox(prevBox => ({ ...prevBox, x: newX, y: newY }));
    } else if (isResizing) {
      const { clientX, clientY } = e;
      const dx = (clientX - startPositionRef.current.x) / scaleX;
      const dy = (clientY - startPositionRef.current.y) / scaleY;
      startPositionRef.current = { x: clientX, y: clientY };

      setBoundingBox(prevBox => {
        let updatedBox = { ...prevBox };

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

        updatedBox.x = Math.max(0, Math.min(updatedBox.x, imageWidth - updatedBox.width));
        updatedBox.y = Math.max(0, Math.min(updatedBox.y, imageHeight - updatedBox.height));
        updatedBox.width = Math.max(100, Math.min(updatedBox.width, imageWidth - updatedBox.x));
        updatedBox.height = Math.max(30, Math.min(updatedBox.height, imageHeight - updatedBox.y));

        return updatedBox;
      });
    }
  }, [isDragging, isResizing, currentResizeHandle, imageWidth, imageHeight, renderSize, boundingBox]);

  const handleMouseRelease = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    setResizing(false);
    setTimeout(() => setIsInteractingWithBoundingBox(false), 50);
  }, [isDragging, isResizing, setIsInteractingWithBoundingBox]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMovement);
      document.addEventListener('mouseup', handleMouseRelease);
    }
    return () => {
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
      lastBoxUpdateRef.current = boundingBox;
      const yoloCoords = convertTopLeftToCenter(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
      onBoxChange({
        ...yoloCoords,
        category: boundingBox.category
      });
    }
  }, [boundingBox, onBoxChange]);

  const handleCategoryChange = useCallback((selectedOption) => {
    setBoundingBox(prevBox => ({ ...prevBox, category: selectedOption.value }));
  }, []);

  useEffect(() => {
    const updateRenderSize = () => {
      if (boxRef.current && boxRef.current.parentElement) {
        const { width, height } = boxRef.current.parentElement.getBoundingClientRect();
        setRenderSize({ width, height });
      }
    };

    updateRenderSize();
    window.addEventListener('resize', updateRenderSize);
    return () => window.removeEventListener('resize', updateRenderSize);
  }, [imageWidth, imageHeight]);

  return (
    <div
      ref={boxRef}
      className={styles["bounding-box"]}
      style={{
        left: `${(boundingBox.x * renderSize.width / imageWidth)}px`,
        top: `${(boundingBox.y * renderSize.height / imageHeight)}px`,
        width: `${boundingBox.width * renderSize.width / imageWidth}px`,
        height: `${boundingBox.height * renderSize.height / imageHeight}px`
      }}
      onMouseDown={handleDragStart}
    >
      <div className={styles["class-label-container"]}>
        <Select
          ref={selectRef}
          options={filteredClassList.map(cls => ({ value: cls.id, label: cls.name }))}
          value={{
            value: boundingBox.category,
            label: filteredClassList.find(cls => String(cls.id) === String(boundingBox.category))?.name || filteredClassList[0]?.name
          }}
          onChange={handleCategoryChange}
          className={styles["category-select"]}
          classNamePrefix={styles['select']}
          isSearchable
          onMouseDown={e => e.stopPropagation()}
        />
      </div>
      {showRemoveButton && (
        <button
          className={styles["remove-button"]}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
      <div className={`${styles["resize-handle"]} ${styles["nw"]}`} onMouseDown={(e) => handleResizeInitiate(e, 'nw')}></div>
      <div className={`${styles["resize-handle"]} ${styles["ne"]}`} onMouseDown={(e) => handleResizeInitiate(e, 'ne')}></div>
      <div className={`${styles["resize-handle"]} ${styles["sw"]}`} onMouseDown={(e) => handleResizeInitiate(e, 'sw')}></div>
      <div className={`${styles["resize-handle"]} ${styles["se"]}`} onMouseDown={(e) => handleResizeInitiate(e, 'se')}></div>
      {/* <div className={styles["debug-info"]} style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(255,255,255,0.7)', padding: '5px', fontSize: '12px' }}>
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