import React from 'react';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { StoryList } from '../components/StoryList';
import styles from '../styles/Home.module.css';

const Home = () => {
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
              <Link href="/about" className={styles.secondaryButton}>
                Learn More
              </Link>
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
              <div className={styles.featureIcon}>🔄</div>
              <h3 className={styles.featureTitle}>Toggle translations</h3>
              <p className={styles.featureDescription}>
                Show or hide English translations to test your understanding
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <StoryList />
      
      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to start learning?</h2>
          <p className={styles.ctaSubtitle}>
            Explore our collection of Arabic stories and improve your vocabulary today
          </p>
          <Link href="/stories" className={styles.ctaButton}>
            Get Started
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Home; 