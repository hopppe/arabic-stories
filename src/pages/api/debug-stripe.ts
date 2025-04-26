import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if Stripe environment variables are set
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  res.status(200).json({
    stripePublishableKeySet: !!publishableKey,
    stripeSecretKeySet: !!secretKey,
    environment: process.env.NODE_ENV,
    // Don't return actual key values for security
  });
} 