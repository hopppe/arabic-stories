import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { getSupabase } from '../../lib/supabase';
import { createCheckoutSession, getStripe } from '../../lib/stripe';
import styles from '../../styles/Auth.module.css';

const AuthCallbackPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [detailedLog, setDetailedLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setDetailedLog(prev => [...prev, message]);
  };

  useEffect(() => {
    // Check if we need to process the auth callback
    const processAuth = async () => {
      try {
        addLog('Auth callback started');
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        addLog('Supabase client initialized');

        // Process the OAuth callback response
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          addLog(`Auth session error: ${authError.message}`);
          throw authError;
        }
        
        if (!authData.session || !authData.session.user) {
          // Try to get user directly if session doesn't have it
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError || !userData.user) {
            addLog(`Error getting user: ${userError?.message || 'No user found'}`);
            throw new Error(userError?.message || 'Authentication failed: No user found');
          }
          
          addLog(`User authenticated via getUser: ${userData.user.id}`);
          await handleAuthenticatedUser(userData.user);
        } else {
          addLog(`User authenticated via session: ${authData.session.user.id}`);
          await handleAuthenticatedUser(authData.session.user);
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Authentication failed';
        addLog(`Error in auth callback: ${errorMsg}`);
        setError(errorMsg);
        setIsProcessing(false);
        
        // Redirect after error display
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };
    
    // Handle authenticated user
    const handleAuthenticatedUser = async (user: any) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase client not initialized');
      
      // Create a profile record if it doesn't exist
      try {
        addLog('Creating/updating user profile');
        await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
            has_paid: false
          });
        addLog('Profile record created/updated');
      } catch (profileErr) {
        addLog(`Warning: Error with profile creation: ${String(profileErr)}`);
        // Continue despite profile creation error
      }
      
      // Check if the user has already paid
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', user.id)
        .single();
      
      addLog(`Payment status check: ${profile?.has_paid ? 'Paid' : 'Not paid'}`);
      
      // Check if there's a saved returnTo path in session storage
      let returnTo = null;
      try {
        returnTo = sessionStorage.getItem('returnTo');
        addLog(`Saved returnTo path: ${returnTo || 'none'}`);
      } catch (storageErr) {
        addLog(`Warning: Could not access sessionStorage: ${String(storageErr)}`);
      }
      
      // If the user has already paid and there's a returnTo path, redirect there
      if (profile?.has_paid && returnTo) {
        addLog(`Redirecting to saved path: ${returnTo}`);
        try {
          sessionStorage.removeItem('returnTo');
        } catch (e) {
          // Ignore errors clearing session storage
        }
        router.push(returnTo);
        return;
      }
      
      // If the user has already paid, redirect to stories
      if (profile?.has_paid) {
        addLog('User already paid, redirecting to stories');
        router.push('/stories');
        return;
      }
      
      // Otherwise, redirect to payment
      addLog('User needs to pay, initiating payment flow');
      try {
        addLog('Creating checkout session');
        const { sessionId, error: checkoutError } = await createCheckoutSession(user.id);
        
        if (checkoutError || !sessionId) {
          addLog(`Checkout session creation failed: ${checkoutError}`);
          throw new Error(`Failed to create checkout session: ${checkoutError}`);
        }
        
        addLog(`Checkout session created: ${sessionId}`);
        
        // Redirect to Stripe checkout
        const stripe = await getStripe();
        if (!stripe) {
          addLog('Failed to initialize Stripe client');
          throw new Error('Failed to load Stripe client. Check your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
        }
        
        addLog('Redirecting to Stripe checkout...');
        await stripe.redirectToCheckout({ sessionId });
      } catch (stripeErr: any) {
        addLog(`Stripe error: ${stripeErr.message || 'Unknown Stripe error'}`);
        // If Stripe fails, redirect to signup page as fallback
        router.push('/signup?stripe_error=' + encodeURIComponent(stripeErr.message || 'Unknown error'));
      }
    };

    // Check URL parameters to decide if we should process auth
    const code = router.query.code || 
                (typeof window !== 'undefined' && 
                new URLSearchParams(window.location.search).get('code'));
    const hasCodeParam = Boolean(code);
    const hasHashFragment = typeof window !== 'undefined' && window.location.hash && window.location.hash.length > 0;
    
    if (hasCodeParam || hasHashFragment) {
      addLog(`Processing auth callback. Code param: ${hasCodeParam} (${code}), Hash: ${Boolean(hasHashFragment)}`);
      processAuth();
    } else if (router.isReady) {
      addLog('No auth parameters detected, redirecting to login');
      router.push('/login');
    }
  }, [router.isReady, router.query, router.asPath]);

  return (
    <Layout title="Processing Login | Arabic Stories">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          {isProcessing ? (
            <>
              <h1 className={styles.authTitle}>Processing Login</h1>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.processingText}>Please wait while we complete your login...</p>
            </>
          ) : (
            <>
              <h1 className={styles.authTitle}>Authentication Error</h1>
              <p className={styles.errorMessage}>{error}</p>
              <p className={styles.redirectText}>Redirecting you back to login...</p>
              {detailedLog.length > 0 && (
                <div className={styles.logDetails}>
                  <details>
                    <summary>Detailed log (for troubleshooting)</summary>
                    <pre>{detailedLog.join('\n')}</pre>
                  </details>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuthCallbackPage; 