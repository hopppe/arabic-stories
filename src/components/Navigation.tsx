import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import styles from './Navigation.module.css';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const { user, signOut, isPaid } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
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

  // Toggle dev options with Alt+D key combination (or Option+D on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt+D (Windows/Linux) or Option+D (Mac)
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        console.log('Dev mode toggle activated');
        setShowDevOptions(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (showMobileMenu && 
          navRef.current && 
          menuButtonRef.current && 
          !navRef.current.contains(event.target as Node) &&
          !menuButtonRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileMenu]);

  const handleSignOut = async () => {
    await signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };
  
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleCreateStoryClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLoginPrompt(true);
      
      // Auto-hide the prompt after 3 seconds
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
      }
      
      promptTimeoutRef.current = setTimeout(() => {
        setShowLoginPrompt(false);
      }, 3000);
    }
  };
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoPrimary} onClick={(e) => {
            // Triple-click on the logo word "Arabic" toggles dev mode
            if (e.detail === 3) {
              e.preventDefault();
              setShowDevOptions(prev => !prev);
              console.log('Dev mode toggled via logo triple-click');
            }
          }}>Arabic</span>
          <span className={styles.logoSecondary}>Stories</span>
        </Link>
        
        <button 
          className={styles.mobileMenuButton} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={menuButtonRef}
        >
          <span className={`${styles.menuIcon} ${showMobileMenu ? styles.open : ''}`}></span>
        </button>
        
        <nav ref={navRef} className={`${styles.nav} ${showMobileMenu ? styles.showMobileNav : ''}`}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            Home
          </Link>
          <Link 
            href="/stories" 
            className={`${styles.navLink} ${router.pathname.includes('/stories') && !router.pathname.includes('/stories/create') ? styles.active : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            Stories
          </Link>
          
          <div className={styles.createStoryWrapper}>
            <Link 
              href={user && isPaid ? "/stories/create" : "/login?returnTo=/stories/create"}
              className={`${styles.navLink} ${router.pathname === '/stories/create' ? styles.active : ''}`}
              onClick={(e) => {
                setShowMobileMenu(false);
                if (!user) {
                  handleCreateStoryClick(e);
                }
              }}
            >
              Create Story
            </Link>
            
            {showLoginPrompt && (
              <div className={styles.loginPrompt}>
                <p>Please sign in to create stories</p>
                <div className={styles.promptButtons}>
                  <Link href="/login" className={styles.promptButton}>Log In</Link>
                  <Link href="/signup" className={styles.promptButton}>Sign Up</Link>
                </div>
              </div>
            )}
          </div>
          
          <Link 
            href="/about" 
            className={`${styles.navLink} ${router.pathname === '/about' ? styles.active : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            About
          </Link>
          
          {/* Developer tools - shown when Alt+D is pressed */}
          {showDevOptions && (
            <Link 
              href="/test-supabase" 
              className={`${styles.navLink} ${styles.devLink} ${router.pathname === '/test-supabase' ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Test DB
            </Link>
          )}
          
          <div className={styles.authLinks}>
            {user ? (
              <>
                <span className={styles.userEmail}>{user.email}</span>
                <button 
                  onClick={handleSignOut} 
                  className={styles.authButton}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`${styles.authButton} ${router.pathname === '/login' ? styles.active : ''}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className={`${styles.signupButton} ${router.pathname === '/signup' ? styles.active : ''}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}; 