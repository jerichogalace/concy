import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { storeVerificationCode } from '@/lib/verification-store'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate and store verification code
    const code = storeVerificationCode(email)

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured. Verification code:', code)
      // For development, return the code in response (remove in production)
      return NextResponse.json({
        success: true,
        message: 'Verification code generated (development mode - check console)',
        devCode: code // Remove in production
      })
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'DOST-PCIEERD <noreply@dost-pcieerd.gov.ph>',
      to: email,
      subject: 'Admin Password Change - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #0369a1, #0284c7); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">DOST - PCIEERD (EUSTDD)</h1>
            <p style="color: #bae6fd; margin: 5px 0 0 0;">Admin Password Change</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">
              You have requested to change your admin password. Please use the following verification code:
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px dashed #0284c7;">
              <span style="font-size: 36px; font-weight: bold; color: #0369a1; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            <p style="color: #64748b; font-size: 14px;">
              If you did not request this change, please ignore this email.
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} DOST - PCIEERD (EUSTDD). All rights reserved.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email'
    })

  } catch (error) {
    console.error('Error in send-verification:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    )
  }
}
