import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Story } from '../types/Story';
import { getWordMappingsForStory } from '../data/mappings';
import { splitArabicText } from '../data/stories';
import { LearnedWordsList, LearnedWord } from './LearnedWordsList';
import { UserStory } from '../lib/supabase';
import { useRouter } from 'next/router';
import { getSupabase } from '../lib/supabase';
import styles from './StoryView.module.css';

interface StoryViewProps {
  story: Story | UserStory;
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
  const router = useRouter();
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [clickedPhrases, setClickedPhrases] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Check if the story is a user-created story
  const isUserStory = 'user_id' in story;
  
  // Check if current user is the creator of the story
  const isStoryCreator = isUserStory && story.user_id === currentUserId;
  
  // Add a ref for tooltip positioning
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const wordRef = useRef<HTMLSpanElement | null>(null);

  // Function to calculate tooltip position
  const calculateTooltipPosition = useCallback((wordElement: HTMLElement | null) => {
    if (!wordElement) return null;
    
    const rect = wordElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Default position (center below)
    let position = { horizontal: 'center', vertical: 'bottom' };
    
    // Check if tooltip would go off screen to the left
    if (rect.left < 150) {
      position.horizontal = 'left';
    } 
    // Check if tooltip would go off screen to the right
    else if (rect.right > viewportWidth - 150) {
      position.horizontal = 'right';
    }
    
    return position;
  }, []);
  
  useEffect(() => {
    // Check if story is a UserStory with word_mappings
    if ('word_mappings' in story && story.word_mappings) {
      setMappings(story.word_mappings);
    } else {
      // Fall back to built-in mappings
      const storyMappings = getWordMappingsForStory(story.id);
      setMappings(storyMappings);
    }
    
    // Load learned words from localStorage
    const savedWords = localStorage.getItem(`learnedWords-${story.id}`);
    if (savedWords) {
      const parsedWords = JSON.parse(savedWords) as LearnedWord[];
      setLearnedWords(parsedWords);
      setClickedPhrases(new Set(parsedWords.map(word => word.arabic)));
    }
  }, [story]);
  
  useEffect(() => {
    // Get current user ID from Supabase
    const fetchCurrentUser = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        setCurrentUserId(session.session.user.id);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
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
  
  // Function to handle story deletion
  const handleDeleteStory = async () => {
    if (!isUserStory || !isStoryCreator) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // Get Supabase client directly in the component
      const supabase = getSupabase();
      
      if (!supabase) {
        throw new Error('Could not initialize database connection');
      }
      
      // Check authentication
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('User not authenticated, please sign in again');
      }
      
      // Verify user is the creator of the story
      if (session.session.user.id !== story.user_id) {
        throw new Error('You do not have permission to delete this story');
      }
      
      console.log('Deleting story with ID:', story.id);
      
      // Delete directly from the client
      const { error: deleteError } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', story.id);
        
      if (deleteError) {
        console.error('Error deleting story:', deleteError);
        throw new Error(deleteError.message || 'Failed to delete story');
      }
      
      console.log('Story deleted successfully, redirecting to my stories page');
      
      // Success - navigate immediately to my-stories page to prevent trying to load deleted story
      router.push('/stories/my-stories').then(() => {
        // Show a success message after redirect
        alert('Story deleted successfully');
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      setDeleteError(error instanceof Error ? error.message : 'An error occurred while deleting the story');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className={styles.storyViewContainer}>
      <div className={styles.storyHeader}>
        <div>
          <h1 className={styles.storyTitle}>{story.title.english}</h1>
          <h2 className={styles.storyArabicTitle}>{story.title.arabic}</h2>
        </div>
        <div className={styles.storyActions}>
          {isStoryCreator && (
            <button 
              className={styles.deleteStoryButton}
              onClick={handleDeleteStory}
              disabled={isDeleting}
              aria-label="Delete story"
            >
              {isDeleting ? 'Deleting...' : 'Delete Story'}
            </button>
          )}
          <button 
            className={styles.translationToggle} 
            onClick={toggleTranslations}
            aria-pressed={showTranslations}
          >
            {showTranslations ? 'Hide' : 'Show'} Translations
          </button>
        </div>
      </div>
      
      {deleteError && (
        <div className={styles.errorMessage}>
          {deleteError}
        </div>
      )}
      
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
                      ref={hoveredToken === token ? wordRef : null}
                      className={`${styles.arabicWord} ${hasTranslation ? styles.translatable : ''} ${isClicked ? styles.clicked : ''}`}
                      onMouseEnter={(e) => {
                        handleTokenHover(token);
                        // Store the element reference for position calculation
                        wordRef.current = e.currentTarget;
                      }}
                      onMouseLeave={handleTokenLeave}
                      onClick={() => handleTokenClick(token)}
                    >
                      {token.text}{' '}
                      {tooltipContent && hoveredToken === token && (
                        <span 
                          ref={tooltipRef}
                          className={`${styles.wordTooltip} ${
                            wordRef.current && calculateTooltipPosition(wordRef.current)?.horizontal === 'left' 
                              ? styles.leftAligned 
                              : wordRef.current && calculateTooltipPosition(wordRef.current)?.horizontal === 'right'
                                ? styles.rightAligned
                                : ''
                          }`}
                        >
                          {tooltipContent}
                        </span>
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