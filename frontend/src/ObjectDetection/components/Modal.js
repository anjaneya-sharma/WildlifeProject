import React, { useCallback, useEffect, useRef, useState } from 'react';
import BoundingBox from './BoundingBox';
import styles from './styles.module.css';
import { getImageBoxes, saveImageBoxes, getImageUrl } from '../api/imageApi.js';
import { logError } from '../utils/error.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Modal = ({ selectedImage, handleCloseModal, classList }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState([]);

  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalBackgroundRef = useRef(null);
  const nextIdRef = useRef(1);
  const [isInteractingWithBoundingBox, setIsInteractingWithBoundingBox] = useState(false);

  const filteredClassList = classList.filter(cls => cls.name.trim().toLowerCase() !== 'all');

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        const data = await getImageBoxes(selectedImage);
        setBoxes(data.boxes);
        if (data.boxes.length > 0) {
          nextIdRef.current = Math.max(...data.boxes.map(box => box.id)) + 1;
        }
      } catch (error) {
        logError('Error fetching boxes:', error);
        toast.error('Error fetching boxes.');
      }
    };
  
    fetchBoxes();
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedImage) return;

    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    const loadingImage = new Image();
    loadingImage.src = getImageUrl(selectedImage);
    loadingImage.onload = updateImageSize;

    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, [selectedImage]);

  const handleBoxChange = useCallback((newBoxData, id) => {
    setBoxes(prevBoxes =>
      prevBoxes.map(box =>
        box.id === id ? { 
          ...box, 
          ...newBoxData,
          category: newBoxData.category,
          class_id: newBoxData.category  
        } : box
      )
    );
  }, []);

  const defaultCategory = filteredClassList[0]?.id || null;

  const handleAddBox = useCallback(() => {
    if (filteredClassList.length === 0) return;

    setBoxes(prevBoxes => [
      ...prevBoxes,
      { 
        id: nextIdRef.current,
        detection_id: null,
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        category: defaultCategory
      }
    ]);
    nextIdRef.current += 1;
  }, [filteredClassList, defaultCategory]);

  const handleRemoveBox = useCallback((id) => {
    setBoxes(prevBoxes => {
      if (prevBoxes.length <= 1) return prevBoxes;
      return prevBoxes.filter(box => box.id !== id);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedImage) return;
  
    const boxData = boxes.map(box => {
      const classId = box.class_id !== undefined ? box.class_id : parseInt(box.category, 10);
      
      if (isNaN(classId) || !filteredClassList.some(cls => String(cls.id) === String(classId))) {
        const defaultClassId = filteredClassList[0]?.id;
        console.warn(`Invalid class_id ${classId}, using default ${defaultClassId}`);
        return {
          class_id: defaultClassId,
          x: parseFloat(box.x),
          y: parseFloat(box.y),
          width: parseFloat(box.width),
          height: parseFloat(box.height),
          confidence: parseFloat(box.confidence || 1.0)
        };
      }
      
      return {
        class_id: classId,
        x: parseFloat(box.x),
        y: parseFloat(box.y),
        width: parseFloat(box.width),
        height: parseFloat(box.height),
        confidence: parseFloat(box.confidence || 1.0)
      };
    });
  
    try {
      await saveImageBoxes(selectedImage, boxData);
      toast.success('Changes saved successfully!');
    } catch (error) {
      logError('Error saving annotations:', error);
      toast.error('Failed to save changes.');
    }
  }, [selectedImage, boxes, handleCloseModal, filteredClassList]);

  const handleClickOutside = (e) => {
    if (modalBackgroundRef.current && modalBackgroundRef.current === e.target && !isInteractingWithBoundingBox) {
      handleCloseModal();
    }
  };

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleCloseModal]);

  return (
    <div className={styles.modal} ref={modalBackgroundRef} onClick={handleClickOutside}>
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className={styles["modal-content"]} onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }} ref={modalRef}> 
        <div className={styles["modal-image-container"]}>
          <img
            ref={imageRef}
            src={getImageUrl(selectedImage)}
            alt={`ID: ${selectedImage}`}
            onLoad={() => {
              if (imageRef.current) {
                const { width, height } = imageRef.current.getBoundingClientRect();
                setImageSize({ width, height });
              }
            }}
            className={styles["modal-image"]}
            onDragStart={(e) => e.preventDefault()}
          />
          {imageSize.width > 0 && imageSize.height > 0 && boxes.map((box) => (
            <BoundingBox
              key={box.id}
              id={box.id}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
              onBoxChange={(newBoxData) => handleBoxChange(newBoxData, box.id)}
              initialBox={box}
              onRemove={() => handleRemoveBox(box.id)}
              showRemoveButton={boxes.length > 1}
              setIsInteractingWithBoundingBox={setIsInteractingWithBoundingBox}
              classList={filteredClassList}
            />
          ))}
        </div>
        <div className={styles["modal-controls"]}>
          <button className={`${styles["control-button"]} ${styles["add-button"]}`} onClick={handleAddBox}>Add Box</button>
          <button className={`${styles["control-button"]} ${styles["save-button"]}`} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;