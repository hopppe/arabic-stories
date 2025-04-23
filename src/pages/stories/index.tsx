import React from 'react';
import { Layout } from '../../components/Layout';
import { StoryList } from '../../components/StoryList';
import styles from '../../styles/Stories.module.css';

const StoriesPage = () => {
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
        
        <StoryList />
      </div>
    </Layout>
  );
};

export default StoriesPage; 