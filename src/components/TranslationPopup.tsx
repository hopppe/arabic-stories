'use client';

import React, { useEffect, useRef } from 'react';

interface TranslationPopupProps {
  word: string;
  translation: string;
  isVisible: boolean;
  onClose: () => void;
}

const TranslationPopup: React.FC<TranslationPopupProps> = ({
  word,
  translation,
  isVisible,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Auto-close the popup after 3 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4 transition-opacity">
      <div 
        ref={popupRef}
        className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full border-2 border-blue-100 transform transition-all duration-300 animate-fadeIn"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-800">{word}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Translation</h4>
          <p className="text-gray-800 text-lg">{translation}</p>
        </div>
      </div>
    </div>
  );
};

export default TranslationPopup; 