import { loadStripe } from '@stripe/stripe-js';
import { getSupabase } from './supabase';

// Initialize Stripe outside of functions for better performance
let stripePromise: ReturnType<typeof loadStripe> | null = null;

// Get Stripe promise
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Missing Stripe publishable key. Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
      return null;
    }
    
    try {
      stripePromise = loadStripe(key);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return null;
    }
  }
  return stripePromise;
};

// Create a checkout session for the subscription
export const createCheckoutSession = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Creating checkout session for user:', userId);
    
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from checkout API:', errorData);
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const session = await response.json();
    console.log('Checkout session created successfully');
    return { sessionId: session.id, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { sessionId: null, error: error instanceof Error ? error.message : String(error) };
  }
};

// Verify payment completion
export const verifyPayment = async (sessionId: string) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    console.log('Verifying payment for session:', sessionId);
    
    const response = await fetch(`/api/verify-payment?session_id=${sessionId}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from verify payment API:', errorData);
      throw new Error(errorData.error || `API returned ${response.status}`);
    }
    
    const { success, error: paymentError } = await response.json();
    
    if (success) {
      // Update local user profile
      const supabase = getSupabase();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('Updating user profile after payment:', user.id);
          await supabase
            .from('profiles')
            .upsert({ 
              id: user.id, 
              has_paid: true,
              payment_completed_at: new Date().toISOString() 
            });
        }
      }
    }
    
    return { success, error: paymentError };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}; 