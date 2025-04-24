import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { stories } from '../data/stories';
import { getUserStories } from '../lib/storyService';
import { UserStory } from '../lib/supabase';
import styles from './StoryList.module.css';

interface StoryListProps {
  showUserStories?: boolean;
  title?: string;
  subtitle?: string;
}

export const StoryList: React.FC<StoryListProps> = ({ 
  showUserStories = false,
  title = "Explore Stories",
  subtitle = "Learn Arabic through engaging stories with word-by-word translations"
}) => {
  const router = useRouter();
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user stories if required
  useEffect(() => {
    if (showUserStories) {
      const fetchUserStories = async () => {
        setIsLoading(true);
        try {
          const fetchedStories = await getUserStories();
          console.log('Fetched user stories:', fetchedStories);
          setUserStories(fetchedStories);
        } catch (err: any) {
          console.error('Error fetching user stories:', err);
          setError('Failed to load your stories. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserStories();
    }
  }, [showUserStories]);

  // Determine which stories to display
  const storiesToDisplay = showUserStories ? userStories : stories;
  
  // Handle story click
  const handleStoryClick = (storyId: string) => {
    console.log('Navigating to story:', storyId);
    router.push(`/stories/${storyId}`);
  };

  if (isLoading) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div className={styles.loadingIndicator}>Loading stories...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div className={styles.errorMessage}>{error}</div>
        </div>
      </section>
    );
  }

  // If showing user stories but none exist
  if (showUserStories && userStories.length === 0) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <div className={styles.emptyStateContainer}>
            <p className={styles.emptyStateMessage}>You haven't created any stories yet.</p>
            <Link href="/stories/create" className={styles.createStoryButton}>
              Create Your First Story
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.storyListSection}>
      <div className={styles.storyListContainer}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionSubtitle}>{subtitle}</p>
        
        <div className={styles.storyGrid}>
          {storiesToDisplay.map((story) => (
            <div 
              key={story.id}
              className={styles.storyCard}
              onClick={() => handleStoryClick(story.id)}
              role="link"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleStoryClick(story.id);
                }
              }}
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
                  {showUserStories && (
                    <>
                      <span className={styles.storyDifficulty}>
                        {(story as UserStory).difficulty || 'normal'}
                      </span>
                      <span className={styles.storyDialect}>
                        {(story as UserStory).dialect || 'standard'}
                      </span>
                    </>
                  )}
                  <span className={styles.paragraphCount}>
                    {story.content.english.length} paragraphs
                  </span>
                  <span className={styles.readMoreLink}>Read story</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 