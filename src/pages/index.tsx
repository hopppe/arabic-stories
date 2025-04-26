import React from 'react';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { StoryList } from '../components/StoryList';
import { useAuth } from '../lib/auth';
import styles from '../styles/Home.module.css';

const Home = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Learn Arabic through interactive stories
            </h1>
            <p className={styles.heroSubtitle}>
              Improve your Arabic vocabulary with engaging stories and word-by-word translations
            </p>
            <div className={styles.heroCta}>
              <Link href="/stories" className={styles.primaryButton}>
                Explore Stories
              </Link>
              {user ? (
                <Link href="/stories/create" className={styles.secondaryButton}>
                  Create Story
                </Link>
              ) : (
                <Link href="/login" className={styles.secondaryButton}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.heroImageContainer}>
              <img 
                src="/images/hero-illustration.svg" 
                alt="Arabic Stories Illustration"
                className={styles.illustration}
              />
            </div>
          </div>
        </div>
      </section>
      
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <p className={styles.sectionSubtitle}>
            Learn Arabic at your own pace with our intuitive learning tools
          </p>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📚</div>
              <h3 className={styles.featureTitle}>Read engaging stories</h3>
              <p className={styles.featureDescription}>
                Enjoy a variety of interesting stories in Arabic with English translations
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3 className={styles.featureTitle}>Word-by-word translations</h3>
              <p className={styles.featureDescription}>
                Hover over any Arabic word to see its English translation instantly
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>✍️</div>
              <h3 className={styles.featureTitle}>Create custom stories</h3>
              <p className={styles.featureDescription}>
                Generate personalized stories with your chosen topic, dialect, and vocabulary
              </p>
            </div>
          </div>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔄</div>
              <h3 className={styles.featureTitle}>Toggle translations</h3>
              <p className={styles.featureDescription}>
                Show or hide English translations to test your understanding
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌍</div>
              <h3 className={styles.featureTitle}>Multiple dialects</h3>
              <p className={styles.featureDescription}>
                Practice with Hijazi, Saudi, Jordanian, or Egyptian dialects
              </p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📈</div>
              <h3 className={styles.featureTitle}>Track progress</h3>
              <p className={styles.featureDescription}>
                Save and access your created stories from your personal collection
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <StoryList />
      
      {/* Hidden link to the test page - visible only on click in a specific area */}
      <div style={{ position: 'fixed', bottom: 5, right: 5, width: 10, height: 10, zIndex: 999 }}>
        <Link href="/test-supabase">
          <span style={{ fontSize: 0 }}>Test</span>
        </Link>
      </div>
    </Layout>
  );
};

export default Home; 