import React from 'react';
import { Layout } from '../../components/Layout';
import { StoryList } from '../../components/StoryList';
import { UserStoryList } from '../../components/UserStoryList';
import { useAuth } from '../../lib/auth';
import styles from '../../styles/Stories.module.css';

const StoriesPage = () => {
  const { user } = useAuth();
  
  return (
    <Layout
      title="Arabic Stories | Browse All Stories"
      description="Browse our collection of Arabic stories with word-by-word translations to improve your vocabulary"
    >
      <div className={styles.storiesPage}>
        <div className={styles.heroSection}>
          <div className={styles.container}>
            <h1 className={styles.pageTitle}>Browse Arabic Stories</h1>
            <p className={styles.pageDescription}>
              Select a story to read with word-by-word translations
            </p>
          </div>
        </div>
        
        {/* Display user's own created stories if logged in */}
        {user && (
          <UserStoryList
            title="Your Created Stories"
            subtitle="Stories you've created with your chosen vocabulary words"
          />
        )}
        
        {/* Display community user-generated stories */}
        <StoryList 
          showUserStories={true} 
          title="Created Stories" 
          subtitle="Stories created by users with chosen vocabulary words"
        />
        
        {/* Display built-in stories */}
        <StoryList 
          title="Featured Stories" 
          subtitle="Learn Arabic through our collection of engaging stories"
        />
      </div>
    </Layout>
  );
};

export default StoriesPage; 