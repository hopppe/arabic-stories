import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUserCreatedStories } from '../lib/storyService';
import { UserStory } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import styles from './StoryList.module.css';

interface UserStoryListProps {
  title?: string;
  subtitle?: string;
}

export const UserStoryList: React.FC<UserStoryListProps> = ({ 
  title = "Your Created Stories",
  subtitle = "Stories you've created with your chosen vocabulary words"
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and pagination states
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [dialectFilter, setDialectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 9;

  // Fetch user created stories
  useEffect(() => {
    if (user?.id) {
      const fetchUserCreatedStories = async () => {
        setIsLoading(true);
        try {
          // Log the user ID we're using to query
          console.log('Fetching stories for user ID:', user.id);
          
          const fetchedStories = await getUserCreatedStories(user.id);
          console.log('Fetched user created stories:', fetchedStories);
          setUserStories(fetchedStories);
        } catch (err: any) {
          console.error('Error fetching user created stories:', err);
          setError('Failed to load your created stories. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserCreatedStories();
    }
  }, [user?.id]);

  // Apply filters and pagination
  const filteredStories = userStories.filter(story => {
    return (
      (difficultyFilter === 'all' || story.difficulty === difficultyFilter) &&
      (dialectFilter === 'all' || story.dialect === dialectFilter)
    );
  });

  // Get current stories for pagination
  const indexOfLastStory = currentPage * storiesPerPage;
  const indexOfFirstStory = indexOfLastStory - storiesPerPage;
  const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage);

  // Page navigation
  const goToNextPage = () => {
    setCurrentPage(page => Math.min(page + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(page => Math.max(page - 1, 1));
  };
  
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
          <div className={styles.loadingIndicator}>Loading your stories...</div>
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

  // If no user stories exist
  if (userStories.length === 0) {
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
        
        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="difficulty" className={styles.filterLabel}>Difficulty:</label>
            <select 
              id="difficulty" 
              className={styles.filterSelect}
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="simple">Simple</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="dialect" className={styles.filterLabel}>Dialect:</label>
            <select 
              id="dialect" 
              className={styles.filterSelect}
              value={dialectFilter}
              onChange={(e) => {
                setDialectFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
            >
              <option value="all">All Dialects</option>
              <option value="hijazi">Hijazi</option>
              <option value="saudi">Saudi</option>
              <option value="jordanian">Jordanian</option>
              <option value="egyptian">Egyptian</option>
            </select>
          </div>
        </div>
        
        <div className={styles.storyGrid}>
          {currentStories.map((story) => (
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
                  <h3 className={styles.storyTitle}>{story.title?.english || 'Untitled'}</h3>
                  <h4 className={styles.storyArabicTitle}>{story.title?.arabic || ''}</h4>
                </div>
                <p className={styles.storyPreview}>
                  {story.content?.english && story.content.english[0] 
                    ? story.content.english[0].substring(0, 120) + (story.content.english[0].length > 120 ? '...' : '')
                    : 'No preview available'}
                </p>
                <div className={styles.storyMeta}>
                  <span className={styles.storyDifficulty}>
                    {story.difficulty || 'normal'}
                  </span>
                  <span className={styles.storyDialect}>
                    {story.dialect || 'standard'}
                  </span>
                  <span className={styles.paragraphCount}>
                    {story.content?.english?.length || 0} paragraphs
                  </span>
                  <span className={styles.readMoreLink}>Read story</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination controls */}
        {filteredStories.length > storiesPerPage && (
          <div className={styles.paginationContainer}>
            <button 
              className={styles.paginationButton} 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className={styles.paginationInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className={styles.paginationButton} 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}; 