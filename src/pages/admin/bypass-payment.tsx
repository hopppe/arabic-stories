import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../lib/auth';
import { getSupabase } from '../../lib/supabase';
import styles from '../../styles/Auth.module.css';

const BypassPaymentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<boolean | null>(null);

  // Set isClient to true after component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is logged in and get payment status
  useEffect(() => {
    if (!isClient) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('has_paid')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setPaymentStatus(data?.has_paid === true);
      } catch (err) {
        console.error('Failed to fetch payment status:', err);
        setErrorMessage('Failed to check current payment status');
      }
    };

    checkPaymentStatus();
  }, [user, router, isClient]);

  const handleBypassPayment = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          has_paid: true,
          payment_completed_at: new Date().toISOString()
        });

      if (error) {
        // If the standard method fails, try using the REST API directly
        try {
          console.log('Attempting alternative update method...');
          const apiResult = await fetch('/api/bypass-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          });
          
          const result = await apiResult.json();
          
          if (result.success) {
            setSuccessMessage('Payment has been bypassed successfully using alternative method! You can now create stories.');
            setPaymentStatus(true);
            return;
          } else {
            throw new Error(result.error || 'Alternative update failed');
          }
        } catch (altError) {
          console.error('Alternative bypass method failed:', altError);
          throw error; // throw the original error
        }
      }

      setSuccessMessage('Payment has been bypassed successfully! You can now create stories.');
      setPaymentStatus(true);
    } catch (err) {
      console.error('Failed to bypass payment:', err);
      setErrorMessage('Failed to bypass payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Return a loading state until client-side hydration is complete
  if (!isClient) {
    return <Layout title="Bypass Payment | Arabic Stories"><div className="loading-container"></div></Layout>;
  }

  return (
    <Layout title="Bypass Payment | Arabic Stories">
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Payment Bypass</h1>
          
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          
          <div className={styles.userInfo}>
            <p><strong>User:</strong> {user?.email}</p>
            <p><strong>Payment Status:</strong> {paymentStatus ? 'Paid' : 'Not Paid'}</p>
          </div>
          
          {paymentStatus ? (
            <div className={styles.successMessage}>
              <p>You have already completed payment. You can now create stories!</p>
              <Link href="/stories/create" className={styles.authLink}>
                Create a Story
              </Link>
            </div>
          ) : (
            <>
              <p className={styles.bypassInfo}>
                This page allows you to bypass the payment requirement for testing purposes.
              </p>
              
              <button
                onClick={handleBypassPayment}
                className={styles.primaryButton}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Bypass Payment'}
              </button>
            </>
          )}
          
          <div className={styles.backLink}>
            <Link href="/" className={styles.authLink}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BypassPaymentPage; 