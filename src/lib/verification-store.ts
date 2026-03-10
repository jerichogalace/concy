// In-memory store for verification codes
// In production, this should be stored in a database with expiration

interface VerificationCode {
  code: string
  email: string
  createdAt: number
  expiresAt: number
}

// Store verification codes in memory
const verificationCodes = new Map<string, VerificationCode>()

// Code expiration time: 5 minutes
const CODE_EXPIRATION_MS = 5 * 60 * 1000

export function generateVerificationCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeVerificationCode(email: string): string {
  // Clean up expired codes first
  cleanupExpiredCodes()
  
  const code = generateVerificationCode()
  const now = Date.now()
  
  verificationCodes.set(email.toLowerCase(), {
    code,
    email: email.toLowerCase(),
    createdAt: now,
    expiresAt: now + CODE_EXPIRATION_MS
  })
  
  return code
}

export function verifyCode(email: string, inputCode: string): { valid: boolean; message: string } {
  const record = verificationCodes.get(email.toLowerCase())
  
  if (!record) {
    return { valid: false, message: 'No verification code found. Please request a new code.' }
  }
  
  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email.toLowerCase())
    return { valid: false, message: 'Verification code has expired. Please request a new code.' }
  }
  
  if (record.code !== inputCode) {
    return { valid: false, message: 'Invalid verification code. Please try again.' }
  }
  
  // Code is valid, remove it
  verificationCodes.delete(email.toLowerCase())
  return { valid: true, message: 'Verification successful.' }
}

export function cleanupExpiredCodes(): void {
  const now = Date.now()
  for (const [email, record] of verificationCodes.entries()) {
    if (now > record.expiresAt) {
      verificationCodes.delete(email)
    }
  }
}

export function deleteVerificationCode(email: string): void {
  verificationCodes.delete(email.toLowerCase())
}
