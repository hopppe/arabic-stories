import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '../../components/Layout';
import { verifyPayment } from '../../lib/stripe';
import styles from '../../styles/Payment.module.css';

const PaymentSuccessPage: React.FC = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      if (!session_id || typeof session_id !== 'string') {
        setError('Invalid session ID');
        setIsVerifying(false);
        return;
      }

      try {
        const { success, error } = await verifyPayment(session_id);
        
        if (error) throw new Error(error.toString());
        
        setVerificationSuccess(success);
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message || 'Failed to verify payment');
      } finally {
        setIsVerifying(false);
      }
    };

    if (session_id) {
      verifyPaymentStatus();
    }
  }, [session_id]);

  return (
    <Layout title="Payment Successful | Arabic Stories">
      <div className={styles.paymentContainer}>
        <div className={styles.paymentCard}>
          {isVerifying ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p>Verifying your payment...</p>
            </div>
          ) : verificationSuccess ? (
            <>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.paymentTitle}>Payment Successful!</h1>
              <p className={styles.paymentMessage}>
                Thank you for your payment. You now have access to the story creation feature.
              </p>
              <div className={styles.buttonGroup}>
                <Link href="/stories/create" className={styles.primaryButton}>
                  Create Your First Story
                </Link>
                <Link href="/stories" className={styles.secondaryButton}>
                  Browse Stories
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className={styles.errorIcon}>!</div>
              <h1 className={styles.paymentTitle}>Verification Issue</h1>
              <p className={styles.paymentMessage}>
                {error || 'There was an issue verifying your payment status.'}
              </p>
              <p className={styles.paymentNote}>
                If you believe this is an error, please contact support.
              </p>
              <div className={styles.buttonGroup}>
                <Link href="/stories" className={styles.primaryButton}>
                  Go to Stories
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccessPage; 