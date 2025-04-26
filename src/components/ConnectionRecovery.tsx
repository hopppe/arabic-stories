import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { refreshSupabaseClient } from '../lib/supabase';
import styles from './ConnectionRecovery.module.css';

type ConnectionRecoveryProps = {
  onRecovered?: () => void;
};

export const ConnectionRecovery: React.FC<ConnectionRecoveryProps> = ({ onRecovered }) => {
  const { recoverConnection } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState<boolean | null>(null);

  const handleRecoverConnection = async () => {
    setIsRecovering(true);
    setRecoverySuccess(null);
    
    try {
      // Refresh the Supabase client first
      refreshSupabaseClient();
      
      // Then try to recover the connection
      const success = await recoverConnection();
      setRecoverySuccess(success);
      
      if (success && onRecovered) {
        onRecovered();
      }
    } catch (error) {
      console.error('Error during connection recovery:', error);
      setRecoverySuccess(false);
    } finally {
      setIsRecovering(false);
    }
  };
  
  return (
    <div className={styles.recoveryContainer}>
      <div className={styles.recoveryCard}>
        <h3 className={styles.recoveryTitle}>Connection Issue Detected</h3>
        <p className={styles.recoveryText}>
          We're having trouble connecting to our servers. This might be due to network issues or a temporary server problem.
        </p>
        
        {recoverySuccess === true && (
          <div className={styles.successMessage}>
            Connection successfully restored! You can continue using the application.
          </div>
        )}
        
        {recoverySuccess === false && (
          <div className={styles.errorMessage}>
            Unable to restore connection. Please check your internet connection and try again.
          </div>
        )}
        
        <button 
          className={styles.recoveryButton}
          onClick={handleRecoverConnection}
          disabled={isRecovering}
        >
          {isRecovering ? 'Reconnecting...' : 'Reconnect'}
        </button>
        
        <div className={styles.recoveryTips}>
          <strong>Tips:</strong>
          <ul>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cookies and cache</li>
            <li>Try signing out and signing back in</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 