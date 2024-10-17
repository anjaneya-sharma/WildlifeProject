// BoundingBox.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BoundingBox.css';

const BoundingBox = ({ imageWidth, imageHeight, onBoxChange, initialBox = null }) => {
  
  const [box, setBox] = useState(() => {
    // if initial box is passed, calculate the box dimensions relative to the image size
    // ensures that the bounding box is drawn proportionally to the image dimensions
    // if no initial box data is provided, we default to a preset position and size (10px, 100px).
    if (initialBox) {
      return {
        x: initialBox.x * imageWidth,                                     // scale the x according to the image width
        y: initialBox.y * imageHeight,                                    // scale the y according to the image height
        width: Math.max(initialBox.width * imageWidth, 100),              // ensure a minimum width of 100px (because of category label)
        height: Math.max(initialBox.height * imageHeight, 30),            // ensure a minimum height of 30px (because of category label)
        category: initialBox.category || 'XYZ'                            // default category if not provided
      };
    }
    return { x: 10, y: 10, width: 100, height: 100, category: 'XYZ' };    // deafult values for new bounding boxes
  });


  // states for event listeners
  const [isDragging, setIsDragging] = useState(false);              // state to track if the box is being dragged
  const [isResizing, setIsResizing] = useState(false);              // state to track if the box is being resized
  const [resizeHandle, setResizeHandle] = useState('');             // state to track which handle is used for resizing (nw, ne, sw, se)
  const [isFocused, setIsFocused] = useState(false);                // state to track if the input field is focused, so that if user taps anywhere else the cursor stops blinking
  const [isInteractingWithBox, setIsInteractingWithBox] = useState(false);

  // references to DOM elements
  const boxRef = useRef(null);                                      // reference to the bounding box div
  const inputRef = useRef(null);                                    // reference to the category input field


  const startPosRef = useRef({ x: 0, y: 0 });                       // store the initial mouse position when starting a drag or resize action

  // function to handle starting the drag action
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); 
    setIsInteractingWithBox(true);  // Mark as interacting with the box
    const { clientX, clientY } = e;                                 // mouse coordinates when the click starts
    const { left, top } = boxRef.current.getBoundingClientRect();   // current box position relative to the viewport
    startPosRef.current = { x: clientX - left, y: clientY - top };  // calculate the difference between the click position and the box's position
    setIsDragging(true);                                            // set the dragging state to true, to indicate the box is being moved for event listerners
  }, []);

  // function to handle the start of the resize operation
  const handleResizeStart = useCallback((e, handle) => {
    e.preventDefault();                                             // prevent the default browser action on text selection or dragging
    e.stopPropagation();                                            // stop the event from propagating to parent elements
    const { clientX, clientY } = e;                                 // get the current position of the mouse cursor at the time of the click
    startPosRef.current = { x: clientX, y: clientY };               // store starting mouse position relative to the viewport. allows us to track how far the mouse has moved when resizing the bounding box
    setIsResizing(true);                                            // set the dragging state to true, to indicate the box is being moved for event listerners
    setResizeHandle(handle);                                        // set the current resize handle ('nw', 'ne', 'sw', or 'se') so we know which part of the box is being adjusted

  }, []);


  // function to handle mouse movement during drag or resize
  const handleMouseMove = useCallback((e) => {
    e.preventDefault();                                                                    // prevent the default browser action on text selection or dragging
    if (isDragging) {
      const { clientX, clientY } = e;                                                      // get mouse position
      const { left, top } = boxRef.current.parentElement.getBoundingClientRect();          // get the parent container's position

      // calculate the position of the box
      let newX = clientX - left - startPosRef.current.x; 
      let newY = clientY - top - startPosRef.current.y;

      // ensure the box doesn't move outside the container
      // 5px adjustment for css margin
      newX = Math.max(0, Math.min(newX, imageWidth - box.width - 5));
      newY = Math.max(0, Math.min(newY, imageHeight - box.height - 5));

      setBox(prevBox => ({ ...prevBox, x: newX, y: newY }));                              // update box position
    } else if (isResizing) {
      const { clientX, clientY } = e;                                                     // get the current mouse position during resizing
      const dx = clientX - startPosRef.current.x;                                         // calculate how far the mouse has moved horizontally
      const dy = clientY - startPosRef.current.y;                                         // calculate how far the mouse has moved vertically
      startPosRef.current = { x: clientX, y: clientY };                                   // update start position for a smooth transition

      setBox(prevBox => {
        let newBox = { ...prevBox };                                                      // create a copy of the current box state where we will make the changes and return the next box
        // resize based on which handle is being used
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

        // ensure the box remains within the container and has size at least equal to that of category label
        // 5px adjustment for css margin
        newBox.x = Math.max(0, Math.min(newBox.x, imageWidth - newBox.width - 5));
        newBox.y = Math.max(0, Math.min(newBox.y, imageHeight - newBox.height - 5));
        newBox.width = Math.max(100, Math.min(newBox.width, imageWidth - newBox.x - 5));
        newBox.height = Math.max(30, Math.min(newBox.height, imageHeight - newBox.y - 5));

        return newBox;                                                                    // return the updated box state
      });
    }
  }, [isDragging, isResizing, resizeHandle, box.width, box.height, imageWidth, imageHeight]);

  // function to stop dragging or resizing on mouse up
  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);                                                                // stop dragging when mouse is released
    setIsResizing(false);                                                                // stop resizing when mouse is released
    setIsInteractingWithBox(false);  
  }, []);

  // function to handle category input change
  const handleCategoryChange = useCallback((e) => {
    setBox(prevBox => ({ ...prevBox, category: e.target.value }));                       // notify parent that the box has been updated
  }, []);

  // function to handle input focus (when the category input field is clicked)
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);                                                                  // set focus state to true
  }, []);

  // function to handle input blur (when the category input field is clicked away from)
  const handleInputBlur = useCallback(() => {
    setIsFocused(false);                                                                 // set focus state to false
  }, []);

  // effect to manage mousemove and mouseup events when dragging or resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    // cleanup event listeners when component exits or stops dragging/resizing
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // effect to notify parent component of box changes
  useEffect(() => {
    onBoxChange(box);                                                                   // notify parent of updated box state
  }, [box, onBoxChange]);

  // effect to handle clicks outside the input field and blur it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        inputRef.current.blur();                                                        // blur the input if clicked outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);                         // listen for clicks
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);                    // cleanup listener on exit
    };
  }, []);

  return (
    <div className="bounding-box-container"
      style={{ width: imageWidth, height: imageHeight }}                                // set the container size to match the image
      onMouseDown={(e) => e.preventDefault()}                               
    >
      <div
        ref={boxRef}                                                                    // reference to the bounding box div
        className="bounding-box"
        style={{
          left: `${box.x}px`,
          top: `${box.y}px`, 
          width: `${box.width}px`, 
          height: `${box.height}px`
        }}
        onMouseDown={handleMouseDown}                                                   // handle mouse down event for dragging
      >
        <input
          ref={inputRef}                                                                // reference to the input field
          type="text"
          className="category-input" 
          value={box.category}                                                          // fetch input value from box state
          onChange={handleCategoryChange}                                               // handle category change
          onMouseDown={(e) => e.stopPropagation()}                                      // prevent event propagation on mouse down
          onClick={(e) => e.stopPropagation()}                                          // prevent event propagation on click
          onFocus={handleInputFocus}                                                    // handle input focus
          onBlur={handleInputBlur}                                                      // handle input blur
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