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
    const { hash } = window.location;
    
    const handleCallback = async () => {
      try {
        addLog('Auth callback started');
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        addLog('Supabase client initialized');

        // Process the OAuth callback
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          addLog(`Error getting user: ${error.message}`);
          throw error;
        }
        
        if (data?.user) {
          addLog(`User authenticated: ${data.user.id}`);
          
          // Create a profile record if it doesn't exist
          try {
            addLog('Creating/updating user profile');
            await supabase
              .from('profiles')
              .upsert({ 
                id: data.user.id,
                email: data.user.email,
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
            .eq('id', data.user.id)
            .single();
          
          addLog(`Payment status check: ${profile?.has_paid ? 'Paid' : 'Not paid'}`);
          
          // Check if there's a saved returnTo path in session storage
          const returnTo = sessionStorage.getItem('returnTo');
          addLog(`Saved returnTo path: ${returnTo || 'none'}`);
          
          // If the user has already paid and there's a returnTo path, redirect there
          if (profile?.has_paid && returnTo) {
            addLog(`Redirecting to saved path: ${returnTo}`);
            sessionStorage.removeItem('returnTo');
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
            const { sessionId, error: checkoutError } = await createCheckoutSession(data.user.id);
            
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
        } else {
          addLog('No user data returned, redirecting to login');
          router.push('/login');
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

    // Only process the callback if there's a hash or query parameters
    if ((hash && window) || Object.keys(router.query).length > 0) {
      addLog(`Processing auth callback. Hash present: ${Boolean(hash)}`);
      handleCallback();
    } else {
      addLog('No hash or query parameters, redirecting to login');
      router.push('/login');
    }
  }, [router]);

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