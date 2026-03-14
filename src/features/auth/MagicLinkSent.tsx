import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface MagicLinkSentProps {
  email: string
  shouldCreateUser: boolean
}

const RESEND_COOLDOWN = 60
const MAX_RESENDS = 3
const OTP_LENGTH = 6

export function MagicLinkSent({ email, shouldCreateUser }: MagicLinkSentProps) {
  const navigate = useNavigate()
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCount, setResendCount] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [resendError, setResendError] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const submitOtp = useCallback(async (code: string) => {
    setVerifying(true)
    setOtpError(null)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
      if (error) {
        setOtpError('Nieprawidłowy kod. Spróbuj ponownie.')
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } else {
        navigate('/app')
      }
    } finally {
      setVerifying(false)
    }
  }, [email, navigate])

  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = char

    setOtp(newOtp)
    setOtpError(null)

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newOtp.every((d) => d !== '') && char) {
      submitOtp(newOtp.join(''))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resendCount >= MAX_RESENDS) return
    setResendError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser, emailRedirectTo: window.location.origin + '/app' },
    })
    if (error) {
      setResendError('Nie można wysłać emaila. Spróbuj później.')
    } else {
      setResendCount((c) => c + 1)
      startCooldown()
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="text-4xl">📬</div>
          <h1 className="text-2xl font-semibold text-text-primary">Sprawdź swój email</h1>
          <p className="text-text-secondary text-sm">
            Wysłaliśmy link i kod weryfikacyjny na adres
          </p>
          <p className="text-accent font-medium break-all">{email}</p>
        </div>

        <div className="space-y-4">
          <p className="text-text-secondary text-sm text-center">
            Wpisz 6-cyfrowy kod z emaila
          </p>

          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                disabled={verifying}
                className={`
                  w-11 h-14 text-center text-xl font-semibold rounded-lg border
                  bg-bg-surface text-text-primary
                  focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                  transition-colors disabled:opacity-50
                  ${otpError ? 'border-red-500' : 'border-bg-elevated'}
                `}
              />
            ))}
          </div>

          {verifying && (
            <p className="text-text-secondary text-sm text-center">Weryfikacja...</p>
          )}

          {otpError && (
            <p className="text-red-400 text-sm text-center">{otpError}</p>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-bg-elevated">
          <p className="text-text-muted text-xs text-center">
            Nie dostałeś emaila? Sprawdź folder spam lub
          </p>

          {resendCount >= MAX_RESENDS ? (
            <p className="text-text-muted text-sm text-center">Spróbuj później</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="w-full min-h-[48px] rounded-xl border border-bg-elevated text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {cooldown > 0 ? `Wyślij ponownie (${cooldown}s)` : 'Wyślij ponownie'}
            </button>
          )}

          {resendError && (
            <p className="text-red-400 text-xs text-center">{resendError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
