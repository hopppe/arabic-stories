import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Create a fresh Supabase client for this request
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing Supabase environment variables' 
      });
    }
    
    // Create a direct client just for this operation
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Update the profile using the direct client
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        has_paid: true,
        payment_completed_at: new Date().toISOString() 
      });
    
    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Database error: ${error.message}` 
      });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in bypass payment API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
} 