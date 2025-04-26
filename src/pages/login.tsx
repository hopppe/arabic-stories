import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import styles from '../styles/Auth.module.css';

// Component for login page
const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  // This effect will only run on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && isClient && !redirectAttempted) {
      setRedirectAttempted(true);
      try {
        const returnPath = router.query.returnTo as string || '/';
        // Use router.replace instead of router.push to avoid adding to history
        router.replace(returnPath);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  }, [user, router, isClient, redirectAttempted]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      // Redirect to the return path or home
      if (typeof window !== 'undefined') {
        const returnPath = router.query.returnTo as string || '/';
        console.log('Login successful, redirecting to:', returnPath);
        window.location.href = returnPath;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      // Save returnTo parameter to session storage for the callback page
      if (typeof window !== 'undefined' && router.query.returnTo) {
        sessionStorage.setItem('returnTo', router.query.returnTo as string);
        console.log('Saved returnTo path for Google auth:', router.query.returnTo);
      }
      
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Google auth callback will handle redirection
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };
  
  // Return a loading state until client-side hydration is complete
  if (!isClient) {
    return <Layout title="Login | Arabic Stories"><div className="loading-container"></div></Layout>;
  }
  
  return (
    <Layout title="Login | Arabic Stories">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Login</h1>
          <p className={styles.authDescription}>
            Login to access the story creation feature
          </p>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSignIn} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className={styles.googleButton}
            disabled={isLoading}
          >
            Continue with Google
          </button>
          
          <p className={styles.authFooter}>
            Don't have an account?{' '}
            <Link href="/signup" className={styles.authLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage; 