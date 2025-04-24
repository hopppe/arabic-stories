import React from 'react';
import Link from 'next/link';
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

            <h2 className={styles.sectionTitle}>Create Your Own Stories</h2>
            <p>
              With our <Link href="/stories/create">Create Story</Link> feature, you can generate personalized Arabic stories 
              tailored to your learning needs. This powerful tool allows you to:
            </p>
            <ul className={styles.featureList}>
              <li>Choose your preferred difficulty level (Simple, Easy, or Normal)</li>
              <li>Select an Arabic dialect (Hijazi, Saudi, Jordanian, or Egyptian)</li>
              <li>Specify up to 20 Arabic words you want to practice and include in your story</li>
            </ul>
            
            <h3 className={styles.subSectionTitle}>How to Create a Story</h3>
            <ol className={styles.instructionList}>
              <li>Navigate to the <Link href="/stories/create">Create Story</Link> page</li>
              <li>Enter the required password (this feature is protected as it uses AI resources)</li>
              <li>Select your preferred difficulty level and dialect</li>
              <li>Enter the Arabic words you want to include in your story (separated by commas, tabs, or new lines)</li>
              <li>Click "Create Story" and wait while our AI generates your personalized content</li>
              <li>Once complete, your new story will be added to the stories collection!</li>
            </ol>
            
            <p>
              Custom stories are a great way to practice specific vocabulary that you're learning
              or want to reinforce in a natural, contextual way.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage; 