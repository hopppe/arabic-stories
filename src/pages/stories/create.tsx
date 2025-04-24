import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { generateStory, saveUserStory } from '../../lib/storyService';
import styles from '../../styles/CreateStory.module.css';

const CreateStoryPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    difficulty: 'normal',
    dialect: 'hijazi',
    words: '',
  });
  const [error, setError] = useState('');
  // Add state for password protection
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [passwordError, setPasswordError] = useState('');

  // Only run browser-side code when the component mounts
  useEffect(() => {
    // Check if we're running in a browser
    if (typeof window === 'undefined') return;
    
    // Check if user has already entered password correctly
    const hasAccess = localStorage.getItem('storyCreatorAccess') === 'granted';
    if (hasAccess) {
      setShowPasswordModal(false);
    }
    
    // Initialize form state from localStorage or URL parameters if needed
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
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Password validation function
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'saudisun') {
      // Store in localStorage that user has entered correct password
      localStorage.setItem('storyCreatorAccess', 'granted');
      setShowPasswordModal(false);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordInput(e.target.value);
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return; // Skip on server-side
    
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

      if (wordsToInclude.length === 0) {
        setError('Please include at least one word');
        setIsSubmitting(false);
        setProcessingStep(null);
        return;
      }

      if (wordsToInclude.length > 20) {
        setError('Please limit your list to 20 words or fewer for best results');
        setIsSubmitting(false);
        setProcessingStep(null);
        return;
      }

      try {
        // Generate story using our service
        setProcessingStep('Generating story with AI...');
        const storyData = await generateStory({
          difficulty: formData.difficulty as 'simple' | 'easy' | 'normal',
          dialect: formData.dialect as 'hijazi' | 'saudi' | 'jordanian' | 'egyptian',
          words: wordsToInclude,
        });

        // Save to Supabase
        setProcessingStep('Saving story to database...');
        await saveUserStory(storyData);
        
        // Show success message
        setProcessingStep(null);
        setSuccess('Story created successfully! Redirecting to stories page...');
        
        // Redirect to stories page after a short delay
        setTimeout(() => {
          router.push('/stories');
        }, 2000);
      } catch (err: any) {
        console.error('Error creating story:', err);
        setProcessingStep(null);
        
        // Handle different types of errors
        if (err.message.includes('network') || err.message.includes('connection')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (err.message.includes('permission') || err.message.includes('auth')) {
          setError('Permission denied. Please refresh the page and try again.');
        } else if (err.message.includes('API key')) {
          setError('OpenAI API key is missing or invalid. Please check your configuration.');
        } else if (err.message.includes('not initialized')) {
          setError('Client not initialized. This feature only works in the browser.');
        } else {
          setError(err.message || 'Failed to create story. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setProcessingStep(null);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Create Story | Arabic Stories">
      {showPasswordModal ? (
        <div className={styles.passwordModalOverlay}>
          <div className={styles.passwordModal}>
            <h2>Password Required</h2>
            <p>AI story generation costs money, this feature is password protected.</p>
            <form onSubmit={handlePasswordSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={passwordInput}
                  onChange={handlePasswordChange}
                  className={styles.passwordInput}
                  autoFocus
                />
              </div>
              {passwordError && <div className={styles.passwordError}>{passwordError}</div>}
              <div className={styles.modalButtons}>
                <button type="button" onClick={() => router.push('/stories')} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
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
            <div className={styles.formGroup}>
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
              </select>
              <p className={styles.fieldDescription}>
                Choose the difficulty level of your story.
              </p>
            </div>
            
            <div className={styles.formGroup}>
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
            
            <div className={styles.formGroup}>
              <label htmlFor="words" className={styles.label}>Words to Include</label>
              <textarea 
                id="words" 
                name="words" 
                value={formData.words}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Enter words separated by commas, tabs, or new lines"
                rows={5}
                disabled={isSubmitting}
                required
              ></textarea>
              <p className={styles.fieldDescription}>
                Enter Arabic words you'd like to include in your story. Separate words with commas, tabs, or new lines.
              </p>
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
        </div>
      )}
    </Layout>
  );
};

export default CreateStoryPage; 