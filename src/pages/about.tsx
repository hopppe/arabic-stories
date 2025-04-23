import React from 'react';
import { Layout } from '../components/Layout';
import styles from '../styles/About.module.css';

const AboutPage = () => {
  return (
    <Layout
      title="About Arabic Stories"
      description="Learn about the Arabic Stories project and how it helps you learn Arabic"
    >
      <div className={styles.aboutPage}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>About Arabic Stories</h1>
          <p className={styles.pageDescription}>
            A modern approach to learning Arabic through interactive stories
          </p>
          
          <div className={styles.aboutContent}>
            <p>
              Arabic Stories is an educational platform designed to help you learn Arabic 
              vocabulary through interactive stories. Our word-by-word translation approach
              makes it easy to understand Arabic text and build your vocabulary naturally.
            </p>
            <p>
              We offer stories for all levels, from beginners to advanced learners. Each story
              includes interactive features like word translations, pronunciation guides, and
              vocabulary tracking.
            </p>
            <p>
              Our goal is to make learning Arabic enjoyable and accessible to everyone, regardless
              of their prior knowledge or experience with the language.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage; 