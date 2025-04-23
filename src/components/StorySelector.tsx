'use client';

import React from 'react';
import { stories } from '../data/stories';

interface StorySelectorProps {
  onSelect: (storyId: string) => void;
  selectedStoryId: string;
}

const StorySelector: React.FC<StorySelectorProps> = ({ onSelect, selectedStoryId }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <label htmlFor="story-select" className="block text-lg font-medium text-blue-800 mb-3 md:mb-0">
        Choose a Story to Read:
      </label>
      <div className="relative md:w-2/3">
        <select
          id="story-select"
          value={selectedStoryId}
          onChange={(e) => onSelect(e.target.value)}
          className="block w-full p-3 pr-10 text-base border-2 border-blue-200 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
        >
          {stories.map((story) => (
            <option key={story.id} value={story.id} className="py-2">
              {story.title.english} | {story.title.arabic}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
          <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StorySelector; 