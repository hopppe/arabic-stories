import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { ensureValidSession } from '../lib/supabase';
import styles from './ConnectionRecovery.module.css';

interface ConnectionRecoveryProps {
  onRecoverySuccess: () => void;
}

export const ConnectionRecovery: React.FC<ConnectionRecoveryProps> = ({ 
  onRecoverySuccess 
}) => {
  const { connectionError, recoverConnection, validateSession } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  if (!connectionError) {
    return null;
  }
  
  const handleRecoverClick = async () => {
    setIsRecovering(true);
    
    try {
      // First try validating the session
      const isValid = await validateSession();
      
      if (isValid) {
        console.log('Session validation succeeded, connection recovered');
        onRecoverySuccess();
        return;
      }
      
      // If validation fails, try full recovery
      console.log('Session validation failed, attempting full recovery...');
      const recovered = await recoverConnection();
      
      if (recovered) {
        console.log('Full connection recovery succeeded');
        onRecoverySuccess();
      } else {
        console.error('Connection recovery failed, may need to log in again');
      }
    } catch (error) {
      console.error('Error during connection recovery:', error);
    } finally {
      setIsRecovering(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.alert}>
        <div className={styles.title}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Connection Issue Detected</h3>
        </div>
        
        <p>We're having trouble connecting to our servers. This may affect loading stories and saving your progress.</p>
        
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={handleRecoverClick}
            disabled={isRecovering}
          >
            {isRecovering ? 'Reconnecting...' : 'Reconnect Now'}
          </button>
          
          <button 
            className={styles.secondaryButton}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {showDetails && (
          <div className={styles.details}>
            <p><strong>What happened?</strong></p>
            <p>Your connection to our database (Supabase) was interrupted. This can happen due to:</p>
            <ul>
              <li>Network connectivity issues</li>
              <li>Your session may have expired</li>
              <li>The website was idle for too long</li>
              <li>Browser privacy features blocking connections</li>
            </ul>
            
            <p><strong>What can I do?</strong></p>
            <ul>
              <li>Click "Reconnect Now" to attempt automatic recovery</li>
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>If problems persist, try logging out and back in</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}; 