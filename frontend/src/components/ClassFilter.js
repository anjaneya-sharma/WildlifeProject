// ClassFilter.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const ClassFilter = ({ onClassSelect, selectedClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState(['All']);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchClassFolders();
  }, []);

  const fetchClassFolders = () => {
    axios.get('http://127.0.0.1:8000/classes')
      .then(response => {
        setClasses(response.data.classes);
      })
      .catch(error => {
        console.error('Error fetching class folders:', error);
      });
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (className) => {
    onClassSelect(className);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredClasses = classes.filter(className =>
    className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="navigation-container">
      <div className="filter-container" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="filter-button"
        >
          <span>{selectedClass || 'All'}</span>
          <span className={`arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="class-list">
              {filteredClasses.map((className) => (
                <button
                  key={className}
                  onClick={() => handleSelect(className)}
                  className={`class-option ${selectedClass === className ? 'selected' : ''}`}
                >
                  {className}
                </button>
              ))}
              {filteredClasses.length === 0 && (
                <div className="no-results">No matching classes found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassFilter;