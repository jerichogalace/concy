import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/verification-store'

// In-memory password storage (in production, use a secure database)
let adminPassword = 'pcieerd2024'

export function getPassword(): string {
  return adminPassword
}

export function setPassword(newPassword: string): void {
  adminPassword = newPassword
}

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, newPassword } = await request.json()

    // Validate inputs
    if (!email || !verificationCode || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Verify the code
    const verification = verifyCode(email, verificationCode)
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      )
    }

    // Change the password
    setPassword(newPassword)

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Error in change-password:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    )
  }
}

// API to get current password (for admin store initialization)
export async function GET() {
  return NextResponse.json({
    password: adminPassword
  })
}
