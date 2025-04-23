import React from 'react';
import styles from './LearnedWordsList.module.css';

export interface LearnedWord {
  arabic: string;
  english: string;
  timestamp: number;
}

interface LearnedWordsListProps {
  words: LearnedWord[];
  onClearAll: () => void;
  onRemoveWord: (word: LearnedWord) => void;
}

export const LearnedWordsList: React.FC<LearnedWordsListProps> = ({
  words,
  onClearAll,
  onRemoveWord
}) => {
  if (words.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Click on Arabic words in the story to add them to your learned words list.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Learned Words</h3>
        <button 
          className={styles.clearButton}
          onClick={onClearAll}
          aria-label="Clear all learned words"
        >
          Clear All
        </button>
      </div>
      
      <ul className={styles.wordsList}>
        {words.map((word) => (
          <li key={`${word.arabic}-${word.timestamp}`} className={styles.wordItem}>
            <div className={styles.wordContent}>
              <span className={styles.arabicWord}>{word.arabic}</span>
              <span className={styles.englishWord}>{word.english}</span>
            </div>
            <button 
              className={styles.removeButton}
              onClick={() => onRemoveWord(word)}
              aria-label={`Remove ${word.arabic} from learned words`}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}; 