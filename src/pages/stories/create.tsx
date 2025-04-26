import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '../../components/Layout';
import { generateStory, saveUserStory } from '../../lib/storyService';
import { useAuth } from '../../lib/auth';
import styles from '../../styles/CreateStory.module.css';
import { getStripe, createCheckoutSession } from '../../lib/stripe';
import { UserStory } from '../../lib/supabase';

// Add this function before the main component
function debugLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    
    console.log('LocalStorage Debug - Keys:', keys);
    
    const pendingStory = localStorage.getItem('pendingStory');
    if (pendingStory) {
      try {
        const parsed = JSON.parse(pendingStory);
        console.log('LocalStorage Debug - Pending Story:', {
          id: parsed.id,
          title: parsed.title,
          has_content: !!parsed.content,
          user_id: parsed.user_id,
          recovery_info: {
            timestamp: parsed.recovery_timestamp,
            reason: parsed.recovery_reason
          }
        });
      } catch (e) {
        console.error('LocalStorage Debug - Error parsing pendingStory:', e);
      }
    } else {
      console.log('LocalStorage Debug - No pendingStory found');
    }
  } catch (e) {
    console.error('LocalStorage Debug - Error accessing localStorage:', e);
  }
}

const CreateStoryPage: React.FC = () => {
  const router = useRouter();
  const { user, isPaid, isLoading: authLoading, refreshPaymentStatus, recoverConnection } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [manualRedirectNeeded, setManualRedirectNeeded] = useState(false);
  const [formData, setFormData] = useState({
    difficulty: 'normal',
    dialect: 'hijazi',
    words: '',
    topic: '',
    longStory: false,
  });
  const [error, setError] = useState('');
  const [pendingStory, setPendingStory] = useState<UserStory | null>(null);

  // Only run browser-side code when the component mounts
  useEffect(() => {
    // Check if we're running in a browser
    if (typeof window === 'undefined') return;
    
    // Debug localStorage content
    debugLocalStorage();
    
    console.log("CreateStoryPage: Initial render auth state:", { 
      user: !!user, 
      userId: user?.id, 
      isPaid,
      authLoading
    });
    
    // Refresh payment status as soon as component loads
    if (user) {
      console.log("CreateStoryPage: User authenticated, user ID:", user.id);
      console.log("CreateStoryPage: Current payment status:", isPaid);
      
      // Always refresh to ensure we have the latest status
      refreshPaymentStatus().then(hasPaid => {
        console.log("CreateStoryPage: Payment status refreshed:", hasPaid);
        
        // If they're not paid but should be, check again in 1 second
        // This handles race conditions with session initialization
        if (!hasPaid) {
          setTimeout(() => {
            refreshPaymentStatus().then(secondCheck => {
              console.log("CreateStoryPage: Second payment check:", secondCheck);
            });
          }, 1000);
        }
      });
    } else if (!authLoading) {
      // If not loading and no user, redirect to login
      console.log("CreateStoryPage: No user detected, need to redirect");
      setManualRedirectNeeded(true);
    }
    
    // Initialize form state from localStorage
    const savedParams = localStorage.getItem('createStoryParams');
    if (savedParams) {
      try {
        const params = JSON.parse(savedParams);
        setFormData(params);
        // Clear saved params after loading
        localStorage.removeItem('createStoryParams');
      } catch (e) {
        console.error('Error parsing saved parameters:', e);
      }
    }

    // Check for any pending story in localStorage
    const savedStory = localStorage.getItem('pendingStory');
    if (savedStory) {
      try {
        const storyData = JSON.parse(savedStory);
        console.log('Found pending story in localStorage:', {
          id: storyData.id,
          recovery_timestamp: storyData.recovery_timestamp,
          recovery_reason: storyData.recovery_reason
        });
        setPendingStory(storyData);
      } catch (e) {
        console.error('Error parsing saved story:', e);
        localStorage.removeItem('pendingStory');
      }
    }
  }, [user, refreshPaymentStatus, isPaid, authLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return; // Skip on server-side
    
    // Check if user is authenticated and has paid
    console.log("Create story form submitted - Auth state:", { user: !!user, isPaid });
    
    if (!user) {
      console.log("User not authenticated, redirecting to login");
      // Save form data to localStorage for when they return
      localStorage.setItem('createStoryParams', JSON.stringify(formData));
      window.location.href = '/login?returnTo=/stories/create';
      return;
    }
    
    if (!isPaid) {
      console.log("User not paid, redirecting to signup");
      // Save form data to localStorage for when they return
      localStorage.setItem('createStoryParams', JSON.stringify(formData));
      window.location.href = '/signup';
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setProcessingStep('Validating input...');

    try {
      // Process words - split by comma, tab, or new line
      const wordsToInclude = formData.words
        .split(/[,\t\n]+/)
        .map(word => word.trim())
        .filter(word => word.length > 0);

      if (wordsToInclude.length > 20) {
        setError('Please limit your list to 20 words or fewer for best results');
        setIsSubmitting(false);
        setProcessingStep(null);
        return;
      }

      // Set up a timeout to prevent infinite hanging
      const timeoutDuration = 120000; // 2 minutes for story generation

      // Setup a shorter timeout for database operations
      const dbTimeoutDuration = 15000; // 15 seconds for database operations

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Operation timed out. Please try again.'));
        }, timeoutDuration);
      });

      try {
        // Generate story using our service
        console.log('Starting story generation process...');
        setProcessingStep('Generating story with AI...');
        
        // Race the story generation against the timeout
        const storyData = await Promise.race([
          generateStory({
            difficulty: formData.difficulty as 'simple' | 'easy' | 'normal' | 'advanced',
            dialect: formData.dialect as 'hijazi' | 'saudi' | 'jordanian' | 'egyptian',
            words: wordsToInclude,
            topic: formData.topic.trim() || undefined,
            userId: user.id, // Add user ID to story data
            longStory: formData.longStory,
          }),
          timeoutPromise
        ]) as UserStory;
        
        console.log('Story generated successfully with ID:', storyData.id);
        console.log('Now attempting to save story to database...');

        // Save to Supabase with timeout protection
        setProcessingStep('Saving story to database...');
        try {
          console.log('Calling saveUserStory with user ID:', user.id);
          
          // Ensure the story has the current user's ID
          storyData.user_id = user.id;
          
          // Race the save operation against a shorter timeout
          await Promise.race([
            saveUserStory(storyData),
            new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('Database save operation timed out. Your story was generated but could not be saved.'));
              }, dbTimeoutDuration); // Use shorter timeout for DB operations
            })
          ]);
          
          console.log('Story saved successfully!');
          // Show success message
          setProcessingStep(null);
          setSuccess('Story created successfully! Redirecting to stories page...');
          
          // Clean up any pending stories in localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pendingStory');
          }
          
          // Redirect to stories page after a short delay
          setTimeout(() => {
            router.push('/stories');
          }, 2000);
        } catch (saveError: any) {
          console.error('Error saving story to database:', saveError);
          setProcessingStep(null);
          
          // Simplified error handling - no complex recovery attempts
          if (saveError.message.includes('duplicate') || saveError.message.includes('already exists')) {
            setError('A story with this ID already exists. Please try again.');
          } else if (saveError.message.includes('timeout')) {
            setError('Database operation timed out. Your story was generated but couldn\'t be saved to your account.');
            
            // Store the generated story in localStorage as a backup with more details
            if (typeof window !== 'undefined') {
              try {
                // Store the complete story with timestamp for easier recovery
                const pendingStoryData = {
                  ...storyData,
                  recovery_timestamp: Date.now(),
                  recovery_reason: 'timeout'
                };
                localStorage.setItem('pendingStory', JSON.stringify(pendingStoryData));
                console.log('Story saved to localStorage as backup with timestamp');
              } catch (e) {
                console.error('Failed to save story to localStorage:', e);
              }
            }
          } else {
            // For all other errors, show a generic message with the specific error
            setError(`Database error: ${saveError.message || 'Failed to save the story'}. Please try again.`);
          }
        }
      } catch (genError: any) {
        console.error('Error generating story:', genError);
        setProcessingStep(null);
        
        if (genError.message.includes('timeout')) {
          setError('The operation timed out. Please try again with fewer or simpler words.');
        } else {
          setError(`Error generating story: ${genError.message || 'An unknown error occurred'}. Please try again.`);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in form submission:', error);
      setProcessingStep(null);
      setError(`An unexpected error occurred: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual redirection
  const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
      // Save form state
      localStorage.setItem('createStoryParams', JSON.stringify(formData));
      // Redirect to login with returnTo parameter
      window.location.href = '/login?returnTo=/stories/create';
    }
  };

  // Show loading state with animated spinner while checking auth
  if (authLoading) {
    return (
      <Layout title="Create Story | Arabic Stories">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading authentication state...</p>
        </div>
      </Layout>
    );
  }

  // If manual redirect is needed (no user detected)
  if (manualRedirectNeeded) {
    return (
      <Layout title="Create Story | Arabic Stories">
        <div className={styles.authRequiredContainer}>
          <h1>Login Required</h1>
          <p>You need to log in to create stories. The create story feature requires a one-time payment of $5 to help offset AI costs.</p>
          <div className={styles.buttonGroup}>
            <button 
              onClick={redirectToLogin}
              className={styles.primaryButton}
            >
              Go to Login Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // If not authenticated, show login required
  if (!user) {
    return (
      <Layout title="Create Story | Arabic Stories">
        <div className={styles.authRequiredContainer}>
          <h1>Login Required</h1>
          <p>You need to log in to create stories. The create story feature requires a one-time payment of $5 to help offset AI costs.</p>
          <div className={styles.buttonGroup}>
            <button 
              onClick={redirectToLogin}
              className={styles.primaryButton}
            >
              Go to Login Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // If authenticated but not paid, show payment required
  if (!isPaid) {
    return (
      <Layout title="Create Story | Arabic Stories">
        <div className={styles.authRequiredContainer}>
          <h1>Payment Required</h1>
          <p>
            You're logged in as <strong>{user.email}</strong>, but you need to make a payment to create stories.
          </p>
          <p>
            The story creation feature requires a one-time payment of $5 to help offset AI costs.
            The rest of the site remains free to use.
          </p>
          <div className={styles.buttonGroup}>
            <button 
              onClick={async () => {
                try {
                  // Create checkout session
                  const { sessionId, error } = await createCheckoutSession(user.id);
                  
                  if (error || !sessionId) {
                    console.error('Failed to create checkout session:', error);
                    return;
                  }
                  
                  // Redirect to Stripe checkout
                  const stripe = await getStripe();
                  if (!stripe) {
                    console.error('Failed to load Stripe client');
                    return;
                  }
                  
                  await stripe.redirectToCheckout({ sessionId });
                } catch (err) {
                  console.error('Error redirecting to payment:', err);
                }
              }}
              className={styles.primaryButton}
            >
              Make Payment
            </button>
            <Link href="/stories" className={styles.secondaryButton}>
              Browse Stories
            </Link>
            <button
              onClick={() => refreshPaymentStatus()}
              className={styles.secondaryButton}
            >
              Refresh Payment Status
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // User is authenticated and has paid, show the form
  return (
    <Layout title="Create Story | Arabic Stories">
      <div className={styles.createStoryContainer}>
        <h1 className={styles.pageTitle}>Create Your Arabic Story</h1>
        <p className={styles.pageDescription}>
          Customize your story with difficulty level, dialect preference, and words you want to learn.
        </p>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        {processingStep && (
          <div className={styles.processingMessage}>
            <div className={styles.processingSpinner}></div>
            <p>{processingStep}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.storyForm}>
          <div className={styles.formGroup} style={{ marginBottom: '15px' }}>
            <label htmlFor="difficulty" className={styles.label}>Story Difficulty</label>
            <select 
              id="difficulty" 
              name="difficulty" 
              value={formData.difficulty}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isSubmitting}
              required
            >
              <option value="simple">Simple</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="advanced">Advanced</option>
            </select>
            <p className={styles.fieldDescription}>
              Choose the difficulty level of your story.
            </p>
          </div>
          
          <div className={styles.formGroup} style={{ marginBottom: '15px' }}>
            <label htmlFor="dialect" className={styles.label}>Arabic Dialect</label>
            <select 
              id="dialect" 
              name="dialect" 
              value={formData.dialect}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isSubmitting}
              required
            >
              <option value="hijazi">Hijazi</option>
              <option value="saudi">Saudi</option>
              <option value="jordanian">Jordanian</option>
              <option value="egyptian">Egyptian</option>
            </select>
            <p className={styles.fieldDescription}>
              Select the Arabic dialect for your story.
            </p>
          </div>
          
          <div className={styles.formGroup} style={{ marginBottom: '15px' }}>
            <label htmlFor="topic" className={styles.label}>Story Topic</label>
            <textarea 
              id="topic" 
              name="topic" 
              value={formData.topic}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Enter a topic for your story (optional)"
              rows={1}
              style={{ 
                height: '44px', 
                minHeight: '44px', 
                overflowY: 'hidden', 
                resize: 'none',
                paddingTop: '12px',
                paddingBottom: '12px',
                lineHeight: '20px'
              }}
              disabled={isSubmitting}
            ></textarea>
            <p className={styles.fieldDescription}>
              Enter a topic or theme for your story (optional). Can be a single word or a brief description.
            </p>
          </div>
          
          <div className={styles.formGroup} style={{ marginBottom: '15px' }}>
            <label htmlFor="words" className={styles.label}>Words to Include</label>
            <textarea 
              id="words" 
              name="words" 
              value={formData.words}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Enter words separated by commas, tabs, or new lines (optional)"
              rows={5}
              disabled={isSubmitting}
            ></textarea>
            <p className={styles.fieldDescription}>
              Enter Arabic words you'd like to include in your story (optional). Separate words with commas, tabs, or new lines.
            </p>
          </div>
          
          <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="longStory"
                name="longStory"
                checked={formData.longStory}
                onChange={handleInputChange}
                className={styles.checkbox}
                disabled={isSubmitting}
              />
              <label htmlFor="longStory" className={styles.checkboxLabel}>
                Generate a longer story (approximately twice the regular length)
              </label>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Story...' : 'Create Story'}
            </button>
          </div>
        </form>

        {pendingStory && (
          <div className={styles.pendingStoryAlert}>
            <p>We found a story that was created but not saved to your account. Would you like to recover it?</p>
            <div className={styles.buttonGroup}>
              <button 
                onClick={async () => {
                  setIsSubmitting(true);
                  setError('');
                  setSuccess('');
                  setProcessingStep('Saving recovered story...');
                  
                  try {
                    console.log('Attempting to recover story:', pendingStory.id);
                    
                    // Ensure the story has the current user's ID and create a new ID
                    const recoveredStory = {
                      ...pendingStory,
                      user_id: user.id,
                      id: `story-${Date.now()}` // Generate a new unique ID to avoid conflicts
                    };
                    
                    console.log('Recovery: Saving story with new ID:', recoveredStory.id);
                    await saveUserStory(recoveredStory);
                    
                    // Success
                    console.log('Story recovered successfully');
                    setProcessingStep(null);
                    setSuccess(`Story "${recoveredStory.title.english}" recovered successfully! Redirecting to your stories page...`);
                    localStorage.removeItem('pendingStory');
                    setPendingStory(null);
                    
                    // Redirect
                    setTimeout(() => {
                      router.push('/stories');
                    }, 2000);
                  } catch (error: any) {
                    console.error('Error saving recovered story:', error);
                    setProcessingStep(null);
                    setError(`Failed to save recovered story: ${error.message}. Please try again.`);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                Recover Story
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('pendingStory');
                  setPendingStory(null);
                }}
                className={styles.secondaryButton}
                disabled={isSubmitting}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateStoryPage; 