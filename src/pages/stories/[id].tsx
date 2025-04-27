import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { StoryView } from '../../components/StoryView';
import { stories } from '../../data/stories';
import { getUserStoryById } from '../../lib/storyManager';
import { UserStory } from '../../lib/supabase';
import styles from '../../styles/StoryPage.module.css';

interface StoryPageProps {
  builtInStory: typeof stories[0] | null;
}

const StoryPage = ({ builtInStory }: StoryPageProps) => {
  const router = useRouter();
  const { id } = router.query;
  const [userStory, setUserStory] = useState<UserStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debugging - log the router query parameter
  useEffect(() => {
    console.log('Story page mounted, ID:', id);
    console.log('Built-in story:', builtInStory);
  }, [id, builtInStory]);
  
  // Fetch user-generated story if not a built-in one
  useEffect(() => {
    const fetchUserStory = async () => {
      if (!builtInStory && id) {
        setIsLoading(true);
        try {
          console.log('Fetching user story with ID:', id);
          const story = await getUserStoryById(id as string);
          console.log('User story fetched:', story);
          setUserStory(story);
        } catch (err: any) {
          console.error(`Error fetching user story with ID ${id}:`, err);
          setError('Failed to load story. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserStory();
  }, [builtInStory, id]);
  
  // Determine which story to display
  const story = builtInStory || userStory;
  
  // If the page is still being generated, show loading state
  if (router.isFallback || isLoading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading story...</p>
        </div>
      </Layout>
    );
  }
  
  // If there was an error or story not found
  if (error || !story) {
    return (
      <Layout title="Story Not Found">
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Story Not Found</h1>
          <p className={styles.errorMessage}>
            {error || 'The story you are looking for does not exist.'}
          </p>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/stories')}
          >
            Back to Stories
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout
      title={`${story.title.english} | Arabic Stories`}
      description={`Read ${story.title.english} in Arabic with word-by-word translations`}
    >
      <StoryView story={story} />
      
      {/* Display additional metadata for user-generated stories */}
      {userStory && (
        <div className={styles.userStoryMetadata}>
          <div className={styles.metadataContainer}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Difficulty:</span>
              <span className={styles.metadataValue}>{userStory.difficulty}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Dialect:</span>
              <span className={styles.metadataValue}>{userStory.dialect}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Created:</span>
              <span className={styles.metadataValue}>
                {new Date(userStory.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // We only pre-generate paths for built-in stories
  const paths = stories.map(story => ({
    params: { id: story.id }
  }));
  
  console.log('Generated static paths:', paths);
  
  return {
    paths,
    // Enable fallback for user-generated stories
    fallback: 'blocking' // Changed from 'true' to 'blocking' for better UX
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const storyId = params?.id as string;
  // Try to find a built-in story with this ID
  const builtInStory = stories.find(s => s.id === storyId) || null;
  
  console.log('getStaticProps for story ID:', storyId, 'Found:', !!builtInStory);
  
  return {
    props: {
      builtInStory
    },
    // Added revalidation to refresh data periodically
    revalidate: 60, // refresh every minute
  };
};

export default StoryPage; 