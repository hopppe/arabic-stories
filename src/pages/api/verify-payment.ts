import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getSupabase } from '../../lib/supabase';

// Initialize Stripe with better error handling
let stripe: Stripe | null = null;
try {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not defined');
  } else {
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil',
    });
  }
} catch (error) {
  console.error('Failed to initialize Stripe client:', error);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is initialized
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe client not initialized. Check your STRIPE_SECRET_KEY.' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    console.log('Verifying payment for session:', session_id);
    
    // Retrieve session from Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
      return res.status(500).json({
        success: false,
        error: stripeError instanceof Error ? stripeError.message : String(stripeError),
      });
    }
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        status: session.payment_status,
      });
    }

    // Get user ID from session metadata
    const userId = session.metadata?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in session metadata',
      });
    }

    console.log('Payment verified for user:', userId);

    // Initialize Supabase with retries
    let supabase = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!supabase && retryCount < maxRetries) {
      supabase = getSupabase();
      if (!supabase) {
        console.log(`Supabase initialization attempt ${retryCount + 1} failed, retrying...`);
        retryCount++;
        // Wait 500ms between retries
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!supabase) {
      console.error('All Supabase initialization attempts failed');
      // Continue without updating the database - we can handle this on the client side
      return res.status(200).json({ 
        success: true, 
        warning: 'Payment successful but database update failed. Please refresh your profile.'
      });
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          has_paid: true,
          payment_completed_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        // Return success anyway and let client side handle it
        return res.status(200).json({
          success: true,
          warning: 'Payment successful but profile update failed. Please refresh your profile.'
        });
      }

      console.log('User profile updated successfully');
      return res.status(200).json({ success: true });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return success anyway and let client side handle it
      return res.status(200).json({
        success: true,
        warning: 'Payment successful but database operation failed. Please refresh your profile.'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : String(error),
    });
  }
} 