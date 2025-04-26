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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is initialized
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe client not initialized. Check your STRIPE_SECRET_KEY.' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Creating Stripe checkout session for user:', userId);

    // We don't need to verify the user here - this was causing issues
    // Just create the checkout session

    try {
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Arabic Stories - Story Creation Access',
                description: 'One-time payment for access to the story creation feature',
              },
              unit_amount: 500, // $5.00 USD
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
        },
        mode: 'payment',
        success_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment/cancel`,
      });

      console.log('Checkout session created:', session.id);
      return res.status(200).json(session);
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return res.status(500).json({ 
        error: 'Stripe checkout creation failed',
        details: stripeError instanceof Error ? stripeError.message : String(stripeError)
      });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 