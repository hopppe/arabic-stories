import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables (sanitized for security)
  const envStatus = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
    },
    stripe: {
      public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'set' : 'missing',
      secret_key: process.env.STRIPE_SECRET_KEY ? 'set' : 'missing',
    }
  };

  // Test Supabase connection
  let supabaseStatus = 'not_tested';
  const supabase = getSupabase();
  
  if (!supabase) {
    supabaseStatus = 'initialization_failed';
  } else {
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);
      supabaseStatus = error ? 'connection_error' : 'connected';
    } catch (error) {
      supabaseStatus = 'exception_thrown';
    }
  }

  // Return diagnostic information
  return res.status(200).json({
    environment: envStatus,
    supabase_client: supabaseStatus,
    timestamp: new Date().toISOString(),
  });
} 