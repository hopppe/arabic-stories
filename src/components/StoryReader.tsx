'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { stories } from '../data/stories';
import { getWordMappingsForStory } from '../data/mappings';
import ArabicText from './ArabicText';
import LearnedWords from './LearnedWords';
import TranslationPopup from './TranslationPopup';
import StorySelector from './StorySelector';

const StoryReader: React.FC = () => {
  const searchParams = useSearchParams();
  const storyIdFromUrl = searchParams.get('id');
  
  // State for the selected story
  const [selectedStoryId, setSelectedStoryId] = useState(storyIdFromUrl || stories[0].id);
  const selectedStory = stories.find((story) => story.id === selectedStoryId) || stories[0];

  // State for story-specific word mappings
  const [wordMappings, setWordMappings] = useState<Record<string, string>>({});

  // State for translation popup
  const [popupInfo, setPopupInfo] = useState({
    word: '',
    translation: '',
    isVisible: false,
  });

  // State for learned words
  const [learnedWords, setLearnedWords] = useState<Array<{ word: string; translation: string }>>([]);
  const learnedWordsSet = new Set(learnedWords.map((item) => item.word));

  // Load the appropriate mappings when the story changes
  useEffect(() => {
    const mappings = getWordMappingsForStory(selectedStoryId);
    setWordMappings(mappings);
  }, [selectedStoryId]);

  // Handle URL parameter changes
  useEffect(() => {
    if (storyIdFromUrl && stories.some(story => story.id === storyIdFromUrl)) {
      setSelectedStoryId(storyIdFromUrl);
    }
  }, [storyIdFromUrl]);

  // Handle word click
  const handleWordClick = (word: string, translation: string) => {
    // Show popup
    setPopupInfo({
      word,
      translation,
      isVisible: true,
    });

    // Add to learned words if not already there
    if (!learnedWordsSet.has(word)) {
      setLearnedWords([{ word, translation }, ...learnedWords]);
    } else {
      // If word already exists, move it to the top
      const newLearnedWords = learnedWords.filter(item => item.word !== word);
      setLearnedWords([{ word, translation }, ...newLearnedWords]);
    }
  };

  // Close popup
  const closePopup = () => {
    setPopupInfo((prev) => ({ ...prev, isVisible: false }));
  };

  // Clear learned words
  const clearLearnedWords = () => {
    setLearnedWords([]);
  };

  // Reset learned words when story changes
  useEffect(() => {
    clearLearnedWords();
  }, [selectedStoryId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Stories
          </Link>
          <h1 className="text-3xl font-bold text-blue-800 text-center">Arabic Stories Reader</h1>
          <div className="w-24"></div> {/* For layout balance */}
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <StorySelector 
            onSelect={setSelectedStoryId} 
            selectedStoryId={selectedStoryId} 
          />
        </div>
        
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="align-top w-1/2 p-0">
                {/* Story content (left side) */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h2 className="text-2xl font-bold mb-6 text-right text-blue-800">{selectedStory.title.arabic}</h2>
                  
                  <div className="space-y-6">
                    {selectedStory.content.arabic.map((paragraph, index) => (
                      <ArabicText
                        key={index}
                        text={paragraph}
                        onWordClick={handleWordClick}
                        learnedWords={learnedWordsSet}
                        wordMappings={wordMappings}
                      />
                    ))}
                  </div>
                </div>
              </td>
              <td className="align-top w-1/2 p-0">
                {/* Learned words column (right side) */}
                <div className="pl-12">
                  <LearnedWords words={learnedWords} onClear={clearLearnedWords} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <TranslationPopup
          word={popupInfo.word}
          translation={popupInfo.translation}
          isVisible={popupInfo.isVisible}
          onClose={closePopup}
        />
      </div>
    </div>
  );
};

export default StoryReader; 