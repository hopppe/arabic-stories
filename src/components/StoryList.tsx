import React from 'react';
import Link from 'next/link';
import { stories } from '../data/stories';
import styles from './StoryList.module.css';

export const StoryList: React.FC = () => {
  return (
    <section className={styles.storyListSection}>
      <div className={styles.storyListContainer}>
        <h2 className={styles.sectionTitle}>Explore Stories</h2>
        <p className={styles.sectionSubtitle}>
          Learn Arabic through engaging stories with word-by-word translations
        </p>
        
        <div className={styles.storyGrid}>
          {stories.map((story) => (
            <Link 
              href={`/stories/${story.id}`} 
              key={story.id}
              className={styles.storyCard}
            >
              <div className={styles.storyContent}>
                <div className={styles.storyTitleWrapper}>
                  <h3 className={styles.storyTitle}>{story.title.english}</h3>
                  <h4 className={styles.storyArabicTitle}>{story.title.arabic}</h4>
                </div>
                <p className={styles.storyPreview}>
                  {story.content.english[0].substring(0, 120)}
                  {story.content.english[0].length > 120 ? '...' : ''}
                </p>
                <div className={styles.storyMeta}>
                  <span className={styles.paragraphCount}>
                    {story.content.english.length} paragraphs
                  </span>
                  <span className={styles.readMoreLink}>Read story</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}; 