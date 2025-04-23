import React, { useState, useEffect, useMemo } from 'react';
import { Story } from '../types/Story';
import { getWordMappingsForStory } from '../data/mappings';
import { splitArabicText } from '../data/stories';
import { LearnedWordsList, LearnedWord } from './LearnedWordsList';
import styles from './StoryView.module.css';

interface StoryViewProps {
  story: Story;
}

// Define a token object that represents either a word or punctuation in the text
interface Token {
  text: string;
  translation: string | null;
  isPhrasePart: boolean;
  phraseKey: string | null;
  index: number;
}

export const StoryView: React.FC<StoryViewProps> = ({ story }) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [clickedPhrases, setClickedPhrases] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const storyMappings = getWordMappingsForStory(story.id);
    setMappings(storyMappings);
    
    // Load learned words from localStorage
    const savedWords = localStorage.getItem(`learnedWords-${story.id}`);
    if (savedWords) {
      const parsedWords = JSON.parse(savedWords) as LearnedWord[];
      setLearnedWords(parsedWords);
      setClickedPhrases(new Set(parsedWords.map(word => word.arabic)));
    }
  }, [story.id]);
  
  // Save learned words to localStorage when updated
  useEffect(() => {
    localStorage.setItem(`learnedWords-${story.id}`, JSON.stringify(learnedWords));
  }, [learnedWords, story.id]);
  
  // Process paragraphs to identify phrases and tokens
  const processedParagraphs = useMemo(() => {
    if (Object.keys(mappings).length === 0) return [];
    
    return story.content.arabic.map((paragraph) => {
      // Sort mapping keys by length (descending) to prioritize longer phrases
      const sortedMappingKeys = Object.keys(mappings)
        .sort((a, b) => b.length - a.length);
      
      // First, mark which parts of the text are covered by phrases
      let markedText = paragraph;
      let phrasePositions: {start: number; end: number; key: string}[] = [];
      
      // Find positions of all phrases in the text
      sortedMappingKeys.forEach(key => {
        let pos = markedText.indexOf(key);
        while (pos !== -1) {
          // Check if this position overlaps with an existing phrase
          const overlapping = phrasePositions.some(p => 
            (pos >= p.start && pos < p.end) || 
            (pos + key.length > p.start && pos + key.length <= p.end)
          );
          
          if (!overlapping) {
            phrasePositions.push({
              start: pos,
              end: pos + key.length,
              key: key
            });
          }
          
          pos = markedText.indexOf(key, pos + 1);
        }
      });
      
      // Sort phrase positions by start position
      phrasePositions.sort((a, b) => a.start - b.start);
      
      // Create tokens by processing the text with phrase positions
      const tokens: Token[] = [];
      let lastEnd = 0;
      
      phrasePositions.forEach(position => {
        // Add any text before this phrase
        if (position.start > lastEnd) {
          const textBefore = markedText.substring(lastEnd, position.start);
          // Split this into words and add as tokens
          const words = splitArabicText(textBefore);
          words.forEach((word, idx) => {
            const cleanWord = word.replace(/[.,!?;:"']|^"|"$/g, '');
            tokens.push({
              text: word,
              translation: mappings[cleanWord] || null,
              isPhrasePart: false,
              phraseKey: null,
              index: tokens.length
            });
          });
        }
        
        // Add the phrase as a token, with each word marked as part of the phrase
        const phraseText = markedText.substring(position.start, position.end);
        const phraseWords = splitArabicText(phraseText);
        
        phraseWords.forEach((word, idx) => {
          tokens.push({
            text: word,
            translation: mappings[position.key] || null,
            isPhrasePart: true,
            phraseKey: position.key,
            index: tokens.length
          });
        });
        
        lastEnd = position.end;
      });
      
      // Add any remaining text
      if (lastEnd < markedText.length) {
        const textAfter = markedText.substring(lastEnd);
        const words = splitArabicText(textAfter);
        words.forEach((word, idx) => {
          const cleanWord = word.replace(/[.,!?;:"']|^"|"$/g, '');
          tokens.push({
            text: word,
            translation: mappings[cleanWord] || null,
            isPhrasePart: false,
            phraseKey: null,
            index: tokens.length
          });
        });
      }
      
      return tokens;
    });
  }, [mappings, story.content.arabic]);
  
  // Function to handle token hover
  const handleTokenHover = (token: Token) => {
    setHoveredToken(token);
  };
  
  // Function to handle token hover leave
  const handleTokenLeave = () => {
    setHoveredToken(null);
  };
  
  // Function to toggle translations
  const toggleTranslations = () => {
    setShowTranslations(!showTranslations);
  };
  
  // Function to handle token click
  const handleTokenClick = (token: Token) => {
    if (!token.translation) return;
    
    const key = token.phraseKey || token.text;
    const translation = token.translation;
    
    // Add word to learned words list if not already added
    if (!clickedPhrases.has(key)) {
      const newLearnedWord: LearnedWord = {
        arabic: key,
        english: translation,
        timestamp: Date.now()
      };
      
      setLearnedWords(prevWords => [newLearnedWord, ...prevWords]);
      setClickedPhrases(prevClickedPhrases => {
        const newClickedPhrases = new Set(prevClickedPhrases);
        newClickedPhrases.add(key);
        return newClickedPhrases;
      });
    }
  };
  
  // Function to determine if a token is in a clicked phrase
  const isTokenClicked = (token: Token): boolean => {
    if (token.phraseKey && clickedPhrases.has(token.phraseKey)) {
      return true;
    }
    
    return clickedPhrases.has(token.text);
  };
  
  // Function to clear all learned words
  const clearLearnedWords = () => {
    setLearnedWords([]);
    setClickedPhrases(new Set());
  };
  
  // Function to remove a single learned word
  const removeLearnedWord = (word: LearnedWord) => {
    setLearnedWords(prevWords => 
      prevWords.filter(w => w.timestamp !== word.timestamp)
    );
    setClickedPhrases(prevClickedPhrases => {
      const newClickedPhrases = new Set(prevClickedPhrases);
      // Only remove if there are no other instances of this word
      if (!learnedWords.some(w => w.arabic === word.arabic && w.timestamp !== word.timestamp)) {
        newClickedPhrases.delete(word.arabic);
      }
      return newClickedPhrases;
    });
  };
  
  // Get tooltip content for a token
  const getTooltipContent = (token: Token): string | null => {
    if (!token.translation) return null;
    
    if (token.isPhrasePart && token.phraseKey) {
      return `${token.phraseKey} → ${token.translation}`;
    }
    
    return token.translation;
  };
  
  return (
    <div className={styles.storyViewContainer}>
      <div className={styles.storyHeader}>
        <div>
          <h1 className={styles.storyTitle}>{story.title.english}</h1>
          <h2 className={styles.storyArabicTitle}>{story.title.arabic}</h2>
        </div>
        <button 
          className={styles.translationToggle} 
          onClick={toggleTranslations}
          aria-pressed={showTranslations}
        >
          {showTranslations ? 'Hide' : 'Show'} Translations
        </button>
      </div>
      
      <div className={styles.storyLayout}>
        <div className={styles.storyContent}>
          {processedParagraphs.map((tokens, paragraphIndex) => (
            <div key={paragraphIndex} className={styles.paragraphContainer}>
              <div className={styles.arabicParagraph}>
                {tokens.map((token) => {
                  const hasTranslation = token.translation !== null;
                  const isClicked = isTokenClicked(token);
                  const tooltipContent = getTooltipContent(token);
                  
                  return (
                    <span
                      key={token.index}
                      className={`${styles.arabicWord} ${hasTranslation ? styles.translatable : ''} ${isClicked ? styles.clicked : ''}`}
                      onMouseEnter={() => handleTokenHover(token)}
                      onMouseLeave={handleTokenLeave}
                      onClick={() => handleTokenClick(token)}
                    >
                      {token.text}{' '}
                      {tooltipContent && hoveredToken === token && (
                        <span className={styles.wordTooltip}>{tooltipContent}</span>
                      )}
                    </span>
                  );
                })}
              </div>
              
              {showTranslations && (
                <div className={styles.englishParagraph}>
                  {story.content.english[paragraphIndex]}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <aside className={styles.sidePanel}>
          <LearnedWordsList 
            words={learnedWords}
            onClearAll={clearLearnedWords}
            onRemoveWord={removeLearnedWord}
          />
        </aside>
      </div>
      
      {hoveredToken && hoveredToken.translation && (
        <div className={styles.translationBar}>
          <div className={styles.translationBarContent}>
            <span className={styles.translationArabicWord}>
              {hoveredToken.phraseKey || hoveredToken.text}
            </span>
            <span className={styles.translationArrow}>→</span>
            <span className={styles.translationEnglishWord}>
              {hoveredToken.translation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 