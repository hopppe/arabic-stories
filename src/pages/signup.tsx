import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { createCheckoutSession, getStripe } from '../lib/stripe';
import styles from '../styles/Auth.module.css';
import { getSupabase } from '../lib/supabase';

const SignupPage: React.FC = () => {
  const router = useRouter();
  const { user, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBypassOption, setShowBypassOption] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // This effect will only run on the client
  useEffect(() => {
    setIsClient(true);
    
    // Check for Stripe error parameter in URL
    if (router.query.stripe_error && typeof router.query.stripe_error === 'string') {
      const errorMessage = decodeURIComponent(router.query.stripe_error);
      setError(`Payment setup failed: ${errorMessage}. Please try again.`);
      setShowBypassOption(true);
    }
  }, [router.query]);
  
  // Handle direct redirect to signup from login
  useEffect(() => {
    if (user && isClient) {
      router.push('/');
    }
  }, [user, router, isClient]);

  const redirectToPayment = async (userId: string) => {
    try {
      // Ensure Supabase client is working
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check your environment variables.');
      }

      // Create checkout session
      const { sessionId, error } = await createCheckoutSession(userId);
      
      if (error || !sessionId) {
        setIsLoading(false);
        setError(`Failed to create checkout session: ${error}`);
        console.error('Checkout session creation failed:', error);
        
        // Provide a fallback option to bypass Stripe for testing
        setShowBypassOption(true);
        return;
      }
      
      // Redirect to Stripe checkout
      const stripe = await getStripe();
      if (!stripe) {
        setIsLoading(false);
        setError('Failed to load Stripe client. Please check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment variables.');
        
        // Show developer debugging information in console
        console.error('Stripe client initialization failed. Environment check:', {
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'set' : 'missing'
        });
        
        setShowBypassOption(true);
        return;
      }
      
      await stripe.redirectToCheckout({ sessionId });
    } catch (err: any) {
      console.error('Error redirecting to payment:', err);
      setError(err.message || 'Failed to redirect to payment page');
      setIsLoading(false);
      
      // Provide a fallback option to bypass Stripe for testing
      setShowBypassOption(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Signing up user with auto-confirmation...');
      const { error, user } = await signUp(email, password);
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      console.log('Signup successful, user:', user);
      
      if (user) {
        // Create a profile record right away to ensure the user exists in our database
        const supabase = getSupabase();
        if (supabase) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({ 
                id: user.id,
                email: email,
                created_at: new Date().toISOString(),
                has_paid: false
              });
              
            if (profileError) {
              console.warn('Failed to create profile record but continuing:', profileError);
            } else {
              console.log('Created profile record for user');
            }
          } catch (profileErr) {
            console.warn('Error creating profile:', profileErr);
          }
        }
        
        await redirectToPayment(user.id);
      } else {
        setError('Failed to create user account');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Signup process error:', err);
      setError(err.message || 'Failed to sign up');
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Google auth callback will handle the payment redirection after auth completes
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    }
  };
  
  // Return a loading state until client-side hydration is complete
  if (!isClient) {
    return <Layout title="Sign Up | Arabic Stories"><div className="loading-container"></div></Layout>;
  }
  
  return (
    <Layout title="Sign Up | Arabic Stories">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Sign Up</h1>
          <p className={styles.authDescription}>
            Create an account to access the story creation feature. A one-time payment of $5 is required to help offset AI costs.
          </p>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSignUp} className={styles.authForm}>
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
                minLength={6}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            
            <div className={styles.pricingInfo}>
              <p className={styles.pricingNote}>You'll be redirected to a secure payment page after signing up</p>
            </div>
            
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account & Pay'}
            </button>
          </form>
          
          {showBypassOption && (
            <div className={styles.bypassOption}>
              <p>Having trouble with payment?</p>
              <div className={styles.paymentOptions}>
                <Link href="/admin/bypass-payment" className={styles.bypassLink}>
                  Use admin bypass for testing
                </Link>
                <span className={styles.optionDivider}>or</span>
                <Link 
                  href="https://buy.stripe.com/test_dR6g1AdTr3AZcAUcMM" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.stripeLink}
                >
                  Use direct payment link
                </Link>
              </div>
            </div>
          )}
          
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className={styles.googleButton}
            disabled={isLoading}
          >
            Sign up with Google
          </button>
          
          <p className={styles.authFooter}>
            Already have an account?{' '}
            <Link href="/login" className={styles.authLink}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SignupPage; 