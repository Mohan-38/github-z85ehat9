import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface VerifyOTPRequest {
  email: string
  otp_code: string
  type: 'email_change' | 'password_reset' | 'signup_verification'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, otp_code, type }: VerifyOTPRequest = await req.json()

    if (!email || !otp_code || !type) {
      return new Response(
        JSON.stringify({ error: 'Email, OTP code, and type are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabaseClient
      .from('email_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp_code)
      .eq('type', type)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired OTP code',
          valid: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark OTP as used
    const { error: updateError } = await supabaseClient
      .from('email_otps')
      .update({ 
        is_used: true, 
        verified_at: new Date().toISOString() 
      })
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('Error marking OTP as used:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Perform the action based on type
    let actionResult = null
    
    if (type === 'email_change' && otpRecord.user_id) {
      // Update user's email in auth.users
      const { error: emailUpdateError } = await supabaseClient.auth.admin.updateUserById(
        otpRecord.user_id,
        { email: email }
      )
      
      if (emailUpdateError) {
        console.error('Error updating user email:', emailUpdateError)
        actionResult = { error: 'Failed to update email' }
      } else {
        actionResult = { success: true, message: 'Email updated successfully' }
      }
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        message: 'OTP verified successfully',
        type,
        email,
        action_result: actionResult,
        verified_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in verify-otp function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})