import { supabase } from '../lib/supabase';

export interface OTPRequest {
  email: string;
  type: 'email_change' | 'password_reset' | 'signup_verification';
  user_id?: string;
}

export interface OTPVerification {
  email: string;
  otp_code: string;
  type: 'email_change' | 'password_reset' | 'signup_verification';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  error?: string;
}

export interface VerifyOTPResponse {
  valid: boolean;
  message: string;
  type?: string;
  email?: string;
  action_result?: any;
  verified_at?: string;
  error?: string;
}

/**
 * Send OTP via Supabase Edge Function
 */
export const sendOTP = async (request: OTPRequest): Promise<OTPResponse> => {
  try {
    console.log('🚀 Sending OTP request:', { email: request.email, type: request.type });

    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: request
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw error;
    }

    console.log('✅ OTP sent successfully:', data);
    return data;

  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Verify OTP via Supabase Edge Function
 */
export const verifyOTP = async (verification: OTPVerification): Promise<VerifyOTPResponse> => {
  try {
    console.log('🔍 Verifying OTP:', { email: verification.email, type: verification.type });

    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: verification
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw error;
    }

    console.log('✅ OTP verified successfully:', data);
    return data;

  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return {
      valid: false,
      message: 'Failed to verify OTP. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Check if email change is allowed (rate limiting)
 */
export const checkEmailChangeRateLimit = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('email_otps')
      .select('created_at')
      .eq('email', email.toLowerCase())
      .eq('type', 'email_change')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking rate limit:', error);
      return true; // Allow on error
    }

    // Allow max 3 email change attempts per hour
    return (data?.length || 0) < 3;

  } catch (error) {
    console.error('Error checking email change rate limit:', error);
    return true; // Allow on error
  }
};

/**
 * Get OTP status for debugging
 */
export const getOTPStatus = async (email: string, type: string): Promise<{
  hasValidOTP: boolean;
  expiresAt?: string;
  attemptsInLastHour: number;
}> => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check for valid OTP
    const { data: validOTP } = await supabase
      .from('email_otps')
      .select('expires_at')
      .eq('email', email.toLowerCase())
      .eq('type', type)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count attempts in last hour
    const { data: recentAttempts } = await supabase
      .from('email_otps')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('type', type)
      .gte('created_at', oneHourAgo);

    return {
      hasValidOTP: !!validOTP,
      expiresAt: validOTP?.expires_at,
      attemptsInLastHour: recentAttempts?.length || 0
    };

  } catch (error) {
    console.error('Error getting OTP status:', error);
    return {
      hasValidOTP: false,
      attemptsInLastHour: 0
    };
  }
};

/**
 * Cleanup expired OTPs (admin function)
 */
export const cleanupExpiredOTPs = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_otps');

    if (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return 0;
    }

    return data || 0;

  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

/**
 * Format OTP for display (with spaces for readability)
 */
export const formatOTP = (otp: string): string => {
  return otp.replace(/(\d{3})(\d{3})/, '$1 $2');
};

/**
 * Validate OTP format
 */
export const validateOTPFormat = (otp: string): boolean => {
  const cleanOTP = otp.replace(/\s/g, ''); // Remove spaces
  return /^\d{6}$/.test(cleanOTP);
};

/**
 * Clean OTP input (remove spaces and non-digits)
 */
export const cleanOTPInput = (otp: string): string => {
  return otp.replace(/\D/g, '').slice(0, 6);
};