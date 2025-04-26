import React from 'react';
import Link from 'next/link';
import { Layout } from '../../components/Layout';
import styles from '../../styles/Payment.module.css';

const PaymentCancelPage: React.FC = () => {
  return (
    <Layout title="Payment Cancelled | Arabic Stories">
      <div className={styles.paymentContainer}>
        <div className={styles.paymentCard}>
          <div className={styles.cancelIcon}>✕</div>
          <h1 className={styles.paymentTitle}>Payment Cancelled</h1>
          <p className={styles.paymentMessage}>
            Your payment was cancelled. You can try again when you're ready.
          </p>
          <p className={styles.paymentNote}>
            The story creation feature requires a one-time payment of $5 to help offset AI costs.
            The rest of the site remains free to use.
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/signup" className={styles.primaryButton}>
              Try Again
            </Link>
            <Link href="/stories" className={styles.secondaryButton}>
              Browse Stories
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCancelPage; 