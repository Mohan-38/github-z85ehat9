import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OTPRequest {
  email: string
  type: 'email_change' | 'password_reset' | 'signup_verification'
  user_id?: string
}

interface BrevoEmailData {
  sender: {
    name: string
    email: string
  }
  to: Array<{
    email: string
    name?: string
  }>
  subject: string
  htmlContent: string
  tags?: string[]
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

    const { email, type, user_id }: OTPRequest = await req.json()

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: 'Email and type are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    const { error: dbError } = await supabaseClient
      .from('email_otps')
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        type,
        user_id,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to store OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send OTP via Brevo
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailContent = generateOTPEmail(otp, type, email)
    
    const emailData: BrevoEmailData = {
      sender: {
        name: 'TechCreator',
        email: 'mohanselenophile@gmail.com'
      },
      to: [{
        email: email,
        name: 'User'
      }],
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      tags: ['otp', 'verification', type]
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify(emailData)
    })

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json().catch(() => ({}))
      console.error('Brevo API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send OTP email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        expires_at: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-otp function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateOTPEmail(otp: string, type: string, email: string) {
  const typeLabels = {
    email_change: 'Email Change Verification',
    password_reset: 'Password Reset',
    signup_verification: 'Account Verification'
  }

  const typeDescriptions = {
    email_change: 'You requested to change your email address. Please use the verification code below to confirm this change.',
    password_reset: 'You requested to reset your password. Please use the verification code below to proceed.',
    signup_verification: 'Welcome! Please use the verification code below to verify your email address and complete your account setup.'
  }

  const subject = `${typeLabels[type as keyof typeof typeLabels]} - Your OTP Code`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .otp-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .otp-code { font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 8px; margin: 10px 0; font-family: monospace; }
        .security-notice { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .highlight { color: #3b82f6; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 ${typeLabels[type as keyof typeof typeLabels]}</h1>
          <p>Secure verification code</p>
        </div>
        
        <div class="content">
          <h2>Hello,</h2>
          
          <p>${typeDescriptions[type as keyof typeof typeDescriptions]}</p>
          
          <div class="otp-box">
            <h3 style="color: #d97706; margin-top: 0;">📱 Your Verification Code</h3>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; color: #92400e;">Enter this code to verify your email</p>
          </div>
          
          <div class="security-notice">
            <h3 style="color: #dc2626; margin-top: 0;">🚨 Security Information</h3>
            <ul style="margin: 0; color: #991b1b;">
              <li><strong>Valid for:</strong> 10 minutes only</li>
              <li><strong>One-time use:</strong> Code expires after verification</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <h3>🔑 Verification Steps:</h3>
          <ol>
            <li>Return to the verification page</li>
            <li>Enter the 6-digit code: <strong>${otp}</strong></li>
            <li>Click "Verify Code" to complete the process</li>
          </ol>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">🛡️ Security Tips</h3>
            <ul style="margin: 0; color: #6b7280;">
              <li>Never share this code with anyone</li>
              <li>TechCreator will never ask for this code via phone or email</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Code expires automatically after 10 minutes</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact us at <a href="mailto:mohanselenophile@gmail.com">mohanselenophile@gmail.com</a></p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 TechCreator. All rights reserved.</p>
          <p>This is an automated security message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}