import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { stories } from '../data/stories';
import { getUserStories } from '../lib/storyManager';
import { UserStory } from '../lib/supabase';
import { ConnectionRecovery } from './ConnectionRecovery';
import styles from './StoryList.module.css';
import { useAuth } from '../lib/auth';

// Define Story interface to match the stories.ts file
interface Story {
  id: string;
  title: {
    english: string;
    arabic: string;
  };
  content: {
    english: string[];
    arabic: string[];
  };
}

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
  const { user } = useAuth();
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  
  // Filtering and pagination states
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [dialectFilter, setDialectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 9;

  // Fetch user stories if required
  const fetchUserStories = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionError(false);
    
    try {
      const fetchedStories = await getUserStories();
      console.log('Fetched user stories:', fetchedStories);
      setUserStories(fetchedStories);
    } catch (err: any) {
      console.error('Error fetching user stories:', err);
      setError('Failed to load your stories. Please try again.');
      // Check if the error is likely a connection issue
      setConnectionError(err.message?.includes('network') || 
                         err.message?.includes('connection') || 
                         err.message?.includes('fetch') ||
                         err.message?.includes('timeout'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (showUserStories) {
      fetchUserStories();
    }
  }, [showUserStories]);

  // Handle recovery success
  const handleRecoverySuccess = () => {
    // Retry fetching stories
    fetchUserStories();
  };

  // Apply filters and pagination
  // Filter out the current user's stories from the community stories
  const filteredStories = showUserStories 
    ? userStories
        .filter(story => {
          // Filter out stories created by the current user
          if (user && story.user_id === user.id) {
            return false;
          }
          // Apply difficulty and dialect filters
          return (
            (difficultyFilter === 'all' || story.difficulty === difficultyFilter) &&
            (dialectFilter === 'all' || story.dialect === dialectFilter)
          );
        })
    : stories;

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

  return (
    <section className={styles.storyListSection}>
      <div className={styles.storyListContainer}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionSubtitle}>{subtitle}</p>

        {/* Display error message if there is an error */}
        {error && !connectionError && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={fetchUserStories} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}
        
        {/* Connection Recovery Component */}
        {connectionError && (
          <ConnectionRecovery onRecoverySuccess={handleRecoverySuccess} />
        )}

        {isLoading ? (
          <div className={styles.loadingIndicator}>
            Loading stories...
          </div>
        ) : (
          <>
            {/* Filter controls for user stories */}
            {showUserStories && (
              <div className={styles.filtersContainer}>
                <div className={styles.filterGroup}>
                  <label htmlFor="difficulty-filter" className={styles.filterLabel}>Difficulty:</label>
                  <select 
                    id="difficulty-filter"
                    value={difficultyFilter}
                    onChange={(e) => {
                      setDifficultyFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Levels</option>
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
                    onChange={(e) => {
                      setDialectFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
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
            )}

            {/* Story grid */}
            {currentStories.length > 0 ? (
              <div className={styles.storyGrid}>
                {currentStories.map((story, index) => {
                  // Handle different story formats
                  const isUserStory = 'user_id' in story;
                  const storyId = isUserStory ? (story as UserStory).id : (story as Story).id;
                  
                  let storyTitle: { english: string, arabic: string };
                  if (isUserStory) {
                    storyTitle = (story as UserStory).title;
                  } else {
                    storyTitle = (story as Story).title;
                  }
                  
                  // Create preview text - first paragraph truncated
                  const previewText = isUserStory
                    ? ((story as UserStory).content?.english?.[0] || '').substring(0, 120) + 
                      ((story as UserStory).content?.english?.[0]?.length > 120 ? '...' : '')
                    : ((story as Story).content.english[0] || '').substring(0, 120) + 
                      ((story as Story).content.english[0]?.length > 120 ? '...' : '');
                  
                  return (
                    <Link
                      href={`/stories/${storyId}`}
                      key={storyId}
                      className={styles.storyCard}
                    >
                      <div className={styles.storyContent}>
                        <div className={styles.storyTitleWrapper}>
                          <h3 className={styles.storyTitle}>
                            {storyTitle.english}
                          </h3>
                          <h4 className={styles.storyArabicTitle}>
                            {storyTitle.arabic}
                          </h4>
                        </div>
                        <p className={styles.storyPreview}>
                          {previewText}
                        </p>
                        <div className={styles.storyMeta}>
                          {isUserStory && (
                            <>
                              <span className={styles.storyDifficulty}>
                                {(story as UserStory).difficulty.charAt(0).toUpperCase() + (story as UserStory).difficulty.slice(1)}
                              </span>
                              <span className={styles.storyDialect}>
                                {(story as UserStory).dialect.charAt(0).toUpperCase() + (story as UserStory).dialect.slice(1)}
                              </span>
                            </>
                          )}
                          <span className={styles.paragraphCount}>
                            {isUserStory 
                              ? `${(story as UserStory).content?.english?.length || 0} paragraphs` 
                              : `${(story as Story).content.english.length} paragraphs`}
                          </span>
                          <span className={styles.readMoreLink}>Read story</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <p className={styles.emptyStateMessage}>No stories found. Try adjusting your filters or create a new story.</p>
                {showUserStories && (
                  <Link href="/stories/create" className={styles.createStoryButton}>
                    Create a Story
                  </Link>
                )}
              </div>
            )}

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
                  className={`${styles.paginationButton} ${styles.seeMoreButton}`}
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  {currentPage === 1 ? "See More Stories" : "Next"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}; 