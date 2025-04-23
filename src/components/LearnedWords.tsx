'use client';

import React from 'react';

interface LearnedWordsProps {
  words: Array<{ word: string; translation: string }>;
  onClear: () => void;
}

const LearnedWords: React.FC<LearnedWordsProps> = ({ words, onClear }) => {
  if (words.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4 text-blue-800">Your Vocabulary List</h2>
        <div className="bg-blue-50 p-5 rounded-lg text-center">
          <div className="text-6xl mb-3">📚</div>
          <p className="text-gray-600">
            Click on words in the story to see their translations and build your vocabulary list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-800">
          Your Vocabulary <span className="bg-blue-100 text-blue-800 text-sm py-0.5 px-2 rounded-full ml-2">{words.length}</span>
        </h2>
        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
        <div className="divide-y divide-gray-100">
          {words.map((item, index) => (
            <div key={index} className={`py-3 ${index === 0 ? 'bg-blue-50 -mx-3 px-3 rounded-lg' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-bold text-xl text-gray-800 mb-1 leading-tight">{item.word}</div>
                  <div className="text-gray-600">{item.translation}</div>
                </div>
                {index === 0 && (
                  <div className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                    New
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearnedWords; 