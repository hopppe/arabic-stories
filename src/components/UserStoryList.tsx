import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUserCreatedStories } from '../lib/storyManager';
import { UserStory } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { ConnectionRecovery } from './ConnectionRecovery';
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
  const { user, validateSession } = useAuth();
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  
  // Filtering and pagination states
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [dialectFilter, setDialectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 9;

  // Fetch user created stories
  const fetchUserCreatedStories = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    setConnectionError(false);
    
    try {
      // Validate session before fetching stories
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        console.warn('Session validation failed before fetching user stories');
        setConnectionError(true);
        setIsLoading(false);
        return;
      }
      
      // Log the user ID we're using to query
      console.log('Fetching stories for user ID:', user.id);
      
      const fetchedStories = await getUserCreatedStories(user.id);
      console.log('Fetched user created stories:', fetchedStories);
      setUserStories(fetchedStories);
    } catch (err: any) {
      console.error('Error fetching user created stories:', err);
      setError('Failed to load your created stories. Please try again.');
      // Check if the error is likely a connection issue
      setConnectionError(err.message?.includes('network') || 
                         err.message?.includes('connection') || 
                         err.message?.includes('fetch') ||
                         err.message?.includes('timeout') ||
                         err.message?.includes('authentication') ||
                         err.message?.includes('sign in'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchUserCreatedStories();
    }
  }, [user?.id]);

  // Handle recovery success
  const handleRecoverySuccess = () => {
    // Retry fetching stories
    fetchUserCreatedStories();
  };
  
  // Filter stories based on selected filters
  const filteredStories = userStories.filter(story => {
    const difficultyMatch = difficultyFilter === 'all' || story.difficulty === difficultyFilter;
    const dialectMatch = dialectFilter === 'all' || story.dialect === dialectFilter;
    return difficultyMatch && dialectMatch;
  });
  
  // Paginate stories
  const indexOfLastStory = currentPage * storiesPerPage;
  const indexOfFirstStory = indexOfLastStory - storiesPerPage;
  const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage);
  
  // Handle page navigation
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  if (isLoading) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <div className={styles.loadingIndicator}>
            Loading stories...
          </div>
        </div>
      </section>
    );
  }
  
  if (error && !connectionError) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <div className={styles.errorMessage}>
            {error}
            <button onClick={fetchUserCreatedStories} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  // Show connection recovery if there's a connection error
  if (connectionError) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
          <ConnectionRecovery onRecoverySuccess={handleRecoverySuccess} />
        </div>
      </section>
    );
  }
  
  if (!user) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <h2 className={styles.sectionTitle}>Sign In Required</h2>
          <p className={styles.sectionSubtitle}>You need to sign in to view your created stories.</p>
          <div className={styles.emptyStateContainer}>
            <button 
              onClick={() => router.push('/login')}
              className={styles.createStoryButton}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  if (userStories.length === 0) {
    return (
      <section className={styles.storyListSection}>
        <div className={styles.storyListContainer}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSubtitle}>{subtitle}</p>
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
        
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="difficulty-filter" className={styles.filterLabel}>Difficulty:</label>
            <select 
              id="difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Difficulties</option>
              <option value="simple">Simple</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="dialect-filter" className={styles.filterLabel}>Dialect:</label>
            <select 
              id="dialect-filter"
              value={dialectFilter}
              onChange={(e) => setDialectFilter(e.target.value)}
              className={styles.filterSelect}
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
          {currentStories.map(story => (
            <Link
              href={`/stories/${story.id}`}
              key={story.id}
              className={styles.storyCard}
            >
              <div className={styles.storyContent}>
                <div className={styles.storyTitleWrapper}>
                  <h3 className={styles.storyTitle}>
                    {story.title.english}
                  </h3>
                  <h4 className={styles.storyArabicTitle}>
                    {story.title.arabic}
                  </h4>
                </div>
                <p className={styles.storyPreview}>
                  {truncateText(story.content.english[0], 120)}
                </p>
                <div className={styles.storyMeta}>
                  <span className={styles.storyDifficulty}>
                    {story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)}
                  </span>
                  <span className={styles.storyDialect}>
                    {story.dialect.charAt(0).toUpperCase() + story.dialect.slice(1)}
                  </span>
                  <span className={styles.paragraphCount}>
                    {`${story.content.english.length} paragraphs`}
                  </span>
                  <span className={styles.readMoreLink}>Read story</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Pagination controls */}
        {filteredStories.length > storiesPerPage && (
          <div className={styles.paginationContainer}>
            <button 
              className={styles.paginationButton} 
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className={styles.paginationInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className={`${styles.paginationButton} ${styles.seeMoreButton}`}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {currentPage === 1 ? "See More Stories" : "Next"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
} 