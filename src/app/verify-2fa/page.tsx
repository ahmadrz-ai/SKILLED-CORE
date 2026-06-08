'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Key, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { verify2FAAndLogin } from '@/app/actions/twoFactor';

export default function Verify2FAPage() {
  const [code, setCode] = useState('');
  const [isBackup, setIsBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Verify code against temporary session cookie
      const res = await verify2FAAndLogin(code);

      if (res.success && res.email && res.otp) {
        // 2. Perform final passwordless OTP login to establish NextAuth JWT session
        const nextAuthRes = await signIn('credentials', {
          email: res.email,
          otp: res.otp,
          redirect: false,
          callbackUrl: '/feed',
        });

        if (nextAuthRes?.error) {
          // The one-time OTP and the temp 2FA cookie have already been consumed, so
          // retrying on this screen is futile. Route the user cleanly back to the
          // password step instead of dead-ending here.
          setError('Could not complete sign-in. Redirecting you to log in again…');
          setTimeout(() => { window.location.href = '/login'; }, 1500);
        } else {
          window.location.href = '/feed';
        }
      } else {
        const sessionExpired = /expired|sign(?:ing)? in again/i.test(res.error || '');
        setError(res.error || 'Invalid code. Please try again.');
        if (sessionExpired) {
          // Pending 2FA session is gone — send them back to the password step rather
          // than leaving them stuck on a screen that can never succeed.
          setTimeout(() => { window.location.href = '/login'; }, 1500);
        } else {
          // Invalid code: keep them here with their input so they can retry.
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setError('An error occurred during verification. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClearSession = () => {
    // Clear temporary 2FA cookie by deleting it and redirecting to login
    document.cookie = 'skilledcore_2fa_temp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-bg-secondary-panel text-text-body font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-bg-card border border-border-default rounded-2xl p-8 shadow-sc-lg relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-sc-purple-600" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <Image src="/logo.png" alt="SkilledCore" width={32} height={32} className="drop-shadow-sm" />
            <span className="font-bold text-sm tracking-wide text-text-heading">SkilledCore</span>
          </div>
          <div className="w-12 h-12 bg-sc-purple-50 rounded-xl flex items-center justify-center text-text-brand border border-sc-purple-100 mb-4">
            <Shield className="w-6 h-6 text-sc-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-heading tracking-tight">Two-Factor Authentication</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-xs">
            {isBackup
              ? 'Enter one of your 8-character backup codes.'
              : 'Enter the 6-digit verification code from your authenticator app.'}
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="verificationCode" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {isBackup ? 'Alphanumeric Backup Code' : '6-Digit Verification Code'}
              </Label>
              <button
                type="button"
                onClick={() => {
                  setIsBackup(!isBackup);
                  setCode('');
                  setError('');
                }}
                className="text-xs font-semibold text-text-brand hover:text-text-brand-hover hover:underline transition-all"
              >
                {isBackup ? 'Use Authenticator App' : 'Use a backup code instead'}
              </button>
            </div>

            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                id="verificationCode"
                type="text"
                maxLength={isBackup ? 8 : 6}
                placeholder={isBackup ? 'XXXXXXXX' : '000000'}
                autoFocus
                value={code}
                onChange={(e) => {
                  const val = e.target.value;
                  setCode(isBackup ? val.toUpperCase().trim() : val.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                className={`pl-9 text-center font-mono tracking-widest text-lg font-bold h-11 bg-bg-input border-border-input focus:border-sc-purple-600 ${
                  isBackup ? 'uppercase' : ''
                }`}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-sc-red-50 border border-sc-red-100 rounded-xl text-sm font-medium text-text-error flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-sc-red-600 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || code.length < (isBackup ? 8 : 6)}
            className="w-full flex items-center justify-center gap-2 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold h-11 rounded-lg shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Verify & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Back Link */}
        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          <button
            onClick={handleClearSession}
            className="text-xs font-semibold text-text-secondary hover:text-text-heading hover:underline transition-all"
          >
            Sign in to a different account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
