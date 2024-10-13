import React, { useState } from 'react';
import './BoundingBox.css';

const BoundingBox = ({ bounding_box, set_bounding_box }) => {
  const [is_dragging, set_is_dragging] = useState(false);
  const [is_resizing, set_is_resizing] = useState(false);
  const [start_coords, set_start_coords] = useState({});
  const [initial_bounding_box, set_initial_bounding_box] = useState({});

  const handle_mouse_down = (e) => {
    if (e.target.className === 'resizer') {
      set_is_resizing(true);
      set_start_coords({ x: e.clientX, y: e.clientY });
      set_initial_bounding_box(bounding_box);
    } else {
      set_is_dragging(true);
      set_start_coords({ x: e.clientX - bounding_box.x, y: e.clientY - bounding_box.y });
    }
  };

  const handle_mouse_move = (e) => {
    if (is_dragging) {
      set_bounding_box((prev) => ({
        ...prev,
        x: e.clientX - start_coords.x,
        y: e.clientY - start_coords.y,
      }));
    }
    if (is_resizing) {
      const new_width = Math.max(50, initial_bounding_box.width + (e.clientX - start_coords.x));
      const new_height = Math.max(50, initial_bounding_box.height + (e.clientY - start_coords.y));
      set_bounding_box((prev) => ({
        ...prev,
        width: new_width,
        height: new_height,
      }));
    }
  };

  const handle_mouse_up = () => {
    set_is_dragging(false);
    set_is_resizing(false);
  };

  return (
    <div
      className="bounding-box"
      style={{
        left: bounding_box.x,
        top: bounding_box.y,
        width: bounding_box.width,
        height: bounding_box.height,
      }}
      onMouseDown={handle_mouse_down}
      onMouseMove={handle_mouse_move}
      onMouseUp={handle_mouse_up}
    >
      <div className="resizer" />
    </div>
  );
};

export default BoundingBox;