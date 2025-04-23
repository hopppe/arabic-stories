import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Navigation.module.css';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoPrimary}>Arabic</span>
          <span className={styles.logoSecondary}>Stories</span>
        </Link>
        
        <nav className={styles.nav}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            href="/stories" 
            className={`${styles.navLink} ${router.pathname.includes('/stories') ? styles.active : ''}`}
          >
            Stories
          </Link>
          <Link 
            href="/about" 
            className={`${styles.navLink} ${router.pathname === '/about' ? styles.active : ''}`}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}; 