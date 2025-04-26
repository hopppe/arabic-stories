import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Navigation } from './Navigation';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Arabic Stories',
  description = 'Learn Arabic through interactive stories with word-by-word translations',
}) => {
  return (
    <div className={styles.layout}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        {children}
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerContent}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoPrimary}>Arabic</span>
              <span className={styles.footerLogoSecondary}>Stories</span>
            </div>
            <p className={styles.footerText}>
              Learn Arabic through interactive stories with word-by-word translations
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerLinkColumn}>
              <h3 className={styles.footerLinkHeading}>Navigate</h3>
              <ul className={styles.footerLinkList}>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/stories">Stories</Link></li>
                <li><Link href="/about">About</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContainer}>
            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} Arabic Stories. All rights reserved. Made by Ethan Hoppe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}; 