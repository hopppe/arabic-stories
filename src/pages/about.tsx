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
              <li>Choose your preferred difficulty level (Simple, Easy, Normal, or Advanced)</li>
              <li>Select an Arabic dialect (Hijazi, Saudi, Jordanian, or Egyptian)</li>
              <li>Specify a story topic or theme to focus your generated content</li>
              <li>Include up to 20 Arabic words you want to practice in your story</li>
              <li>Create longer stories for extended reading practice</li>
            </ul>
            
            <h3 className={styles.subSectionTitle}>How to Create a Story</h3>
            <ol className={styles.instructionList}>
              <li>Create a user account to access the story creation feature</li>
              <li>Make a one-time payment of $5 to help offset the AI costs (all other site features remain free)</li>
              <li>Navigate to the <Link href="/stories/create">Create Story</Link> page</li>
              <li>Select your preferred difficulty level and dialect</li>
              <li>Enter an optional topic for your story</li>
              <li>Enter any Arabic words you want to include (separated by commas, tabs, or new lines)</li>
              <li>Toggle the option for a longer story if desired</li>
              <li>Click "Create Story" and wait while our AI generates your personalized content</li>
              <li>Once complete, your new story will be added to your personal collection!</li>
            </ol>
            
            <h2 className={styles.sectionTitle}>User Accounts</h2>
            <p>
              Creating a user account allows you to:
            </p>
            <ul className={styles.featureList}>
              <li>Generate and save personalized Arabic stories</li>
              <li>Access your created stories anytime from any device</li>
              <li>Track your reading progress across the platform</li>
              <li>Contribute to our growing community of Arabic learners</li>
            </ul>
            
            <p>
              Custom stories are a great way to practice specific vocabulary that you're learning
              or want to reinforce in a natural, contextual way. Our AI-powered system ensures that
              each story is unique, relevant, and tailored to your specified parameters.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage; 