'use client';

import React from 'react';
import { splitArabicText } from '../data/stories';

interface ArabicTextProps {
  text: string;
  onWordClick: (word: string, translation: string) => void;
  learnedWords: Set<string>;
  wordMappings: Record<string, string>;
}

const ArabicText: React.FC<ArabicTextProps> = ({ text, onWordClick, learnedWords, wordMappings }) => {
  // Split the text into words
  const words = splitArabicText(text);

  // Handle word click
  const handleClick = (word: string) => {
    // Clean the word from punctuation for lookup
    const cleanWord = word.replace(/[،.:؟!؛]/g, '');
    
    // Get the translation with fallback
    const translation = wordMappings[cleanWord] || 'Translation not available';
    
    // Call the callback
    onWordClick(cleanWord, translation);
  };

  return (
    <p className="text-2xl leading-relaxed text-right font-arabic" dir="rtl">
      {words.map((word, index) => {
        // Clean the word for checking in learnedWords set
        const cleanWord = word.replace(/[،.:؟!؛]/g, '');
        
        // Check if the word has any punctuation
        const punctuation = word.match(/[،.:؟!؛]/g)?.[0] || '';
        
        // Only the clean part of the word is clickable and can be highlighted
        const wordWithoutPunctuation = word.replace(/[،.:؟!؛]/g, '');
        
        // Determine if this word has a translation
        const hasTranslation = wordMappings[cleanWord] !== undefined;
        
        return (
          <React.Fragment key={index}>
            <span
              className={`cursor-pointer mx-1 py-1 px-0.5 rounded-md 
                ${learnedWords.has(cleanWord) 
                  ? 'bg-yellow-100 border-b-2 border-yellow-400' 
                  : hasTranslation ? 'hover:bg-blue-50 hover:border-b-2 hover:border-blue-300' : 'opacity-80'} 
                transition-all duration-200`}
              onClick={() => handleClick(word)}
              title={hasTranslation ? wordMappings[cleanWord] : 'No translation available'}
            >
              {wordWithoutPunctuation}
            </span>
            {punctuation && <span className="text-gray-600">{punctuation}</span>}
            {index < words.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </p>
  );
};

export default ArabicText; 