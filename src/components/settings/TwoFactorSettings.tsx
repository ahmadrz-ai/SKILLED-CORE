'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, Copy, Check, Download, AlertTriangle,
  ChevronRight, ArrowLeft, Loader2, Key, RefreshCw, Eye, EyeOff, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  generate2FASetup, enable2FA, disable2FA,
  regenerateBackupCodes, getBackupCodes
} from '@/app/actions/twoFactor';

interface TwoFactorSettingsProps {
  initialEnabled: boolean;
  initialVerifiedAt?: Date | null;
  initialBackupCodesCount: number;
}

export default function TwoFactorSettings({
  initialEnabled,
  initialVerifiedAt,
  initialBackupCodesCount
}: TwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(initialVerifiedAt || null);
  const [backupCodesCount, setBackupCodesCount] = useState(initialBackupCodesCount);

  // Setup Flow state
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrUrl, setSetupQrUrl] = useState('');
  const [setupBackupCodes, setSetupBackupCodes] = useState<string[]>([]);
  
  // Inputs
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [codesSavedChecked, setCodesSavedChecked] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Active / Enabled Actions Modals
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [backupCodesTokenInput, setBackupCodesTokenInput] = useState('');
  const [revealedBackupCodes, setRevealedBackupCodes] = useState<string[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealError, setRevealError] = useState('');

  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenTokenInput, setRegenTokenInput] = useState('');
  const [newRegenedBackupCodes, setNewRegenedBackupCodes] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');
  const [newCodesSavedChecked, setNewCodesSavedChecked] = useState(false);

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePasswordInput, setDisablePasswordInput] = useState('');
  const [disableTokenInput, setDisableTokenInput] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableError, setDisableError] = useState('');

  // 1. Setup Trigger
  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await generate2FASetup();
      setSetupSecret(data.secret);
      setSetupQrUrl(data.qrCodeDataUrl);
      setSetupBackupCodes(data.backupCodes);
      setSetupStep(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start 2FA configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy Setup Secret
  const handleCopySecret = () => {
    navigator.clipboard.writeText(setupSecret);
    toast.success('Setup key copied to clipboard.');
  };

  // 2. Verify and Progress Setup Step
  const handleVerifySetup = async () => {
    if (verifyCodeInput.length !== 6) return;
    setIsLoading(true);
    setVerificationError('');
    try {
      const res = await enable2FA(setupSecret, verifyCodeInput, setupBackupCodes);
      if (res.success) {
        setSetupStep(3);
        toast.success('2FA code verified successfully!');
      } else {
        setVerificationError(res.error || 'Incorrect token. Check your authenticator app and try again.');
      }
    } catch (err: any) {
      setVerificationError('Integrity validation failed. Check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Setup
  const handleCompleteSetup = () => {
    setIsEnabled(true);
    setVerifiedAt(new Date());
    setBackupCodesCount(8);
    setSetupStep(null);
    setVerifyCodeInput('');
    setCodesSavedChecked(false);
    toast.success('Two-factor authentication is active.');
  };

  // Copy Backup Codes
  const handleCopyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedCodes(true);
    toast.success('Backup codes copied to clipboard.');
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  // Download Backup Codes as file
  const handleDownloadBackupCodes = (codes: string[]) => {
    const text = `SKILLEDCORE 2FA BACKUP CODES\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes somewhere secure. Each code can only be used once.\n\n${codes.map((c, i) => `Code ${i + 1}: ${c}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skilledcore-2fa-backup-codes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded.');
  };

  // Reveal Active Backup Codes
  const handleRevealBackupCodes = async () => {
    if (backupCodesTokenInput.length !== 6) return;
    setIsRevealing(true);
    setRevealError('');
    try {
      const res = await getBackupCodes(backupCodesTokenInput);
      if (res.success && res.hashedCodes) {
        // Note: they are hashed in DB, wait.
        // Wait, the action returned hashed backup codes!
        // But we want to show raw backup codes once! Or regenerate them.
        // If they are hashed in the database, we CANNOT retrieve the original plain text codes!
        // So "View Backup Codes" shows that they are hashed, but the best option is to REGENERATE new ones if they are lost!
        // Let's explain this to the user elegantly.
        setRevealedBackupCodes(res.hashedCodes);
      } else {
        setRevealError(res.error || 'Incorrect code. Check your app and try again.');
      }
    } catch (err: any) {
      setRevealError('Verification failed.');
    } finally {
      setIsRevealing(false);
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateCodes = async () => {
    if (regenTokenInput.length !== 6) return;
    setIsRegenerating(true);
    setRegenError('');
    try {
      const res = await regenerateBackupCodes(regenTokenInput);
      if (res.success && res.backupCodes) {
        setNewRegenedBackupCodes(res.backupCodes);
        setBackupCodesCount(8);
        toast.success('Backup codes regenerated successfully.');
      } else {
        setRegenError(res.error || 'Incorrect token. Check your authenticator app.');
      }
    } catch (err: any) {
      setRegenError('Verification failed.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Complete Regeneration
  const handleCompleteRegen = () => {
    setShowRegenModal(false);
    setRegenTokenInput('');
    setNewRegenedBackupCodes([]);
    setNewCodesSavedChecked(false);
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!disablePasswordInput || !disableTokenInput) return;
    setIsDisabling(true);
    setDisableError('');
    try {
      const res = await disable2FA(disablePasswordInput, disableTokenInput);
      if (res.success) {
        setIsEnabled(false);
        setVerifiedAt(null);
        setBackupCodesCount(0);
        setShowDisableModal(false);
        setDisablePasswordInput('');
        setDisableTokenInput('');
        toast.success('Two-factor authentication disabled.');
      } else {
        setDisableError(res.error || 'Invalid credentials or authentication token.');
      }
    } catch (err: any) {
      setDisableError('Deactivation failed. Check network.');
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* STATE 1 & 3: MAIN VIEWS */}
        {setupStep === null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm"
          >
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isEnabled ? 'bg-sc-green-50 text-text-success border border-sc-green-100' : 'bg-sc-gray-50 text-text-secondary border border-border-default'
                }`}>
                  {isEnabled ? <ShieldCheck className="w-6 h-6 text-sc-green-600" /> : <Shield className="w-6 h-6 text-sc-gray-500" />}
                </div>
                <div>
                  <h4 className="font-semibold text-base text-text-heading">Two-Factor Authentication</h4>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Add an extra layer of security. Once enabled, you'll need your authenticator app each time you log in.
                  </p>
                </div>
              </div>
              <div className="shrink-0 sm:text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                  isEnabled
                    ? 'bg-sc-green-50 text-sc-green-700 border-sc-green-150'
                    : 'bg-sc-gray-100 text-text-secondary border-border-default'
                }`}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="py-6 space-y-4">
              {!isEnabled ? (
                <p className="text-sm leading-relaxed text-text-body">
                  Two-factor authentication is not active on this account. Protect your profile, projects, and hiring dashboard by verifying each credentials sign-in using standard RFC 6238 TOTP authenticators.
                </p>
              ) : (
                <div className="grid gap-3 text-sm text-text-body bg-bg-secondary-panel rounded-xl p-4 border border-border-default">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-text-secondary font-medium">Last successfully verified:</span>
                    <span className="font-mono text-text-heading font-semibold">
                      {verifiedAt ? new Date(verifiedAt).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-border-subtle">
                    <span className="text-text-secondary font-medium">Backup codes remaining:</span>
                    <span className={`font-mono font-bold ${backupCodesCount < 3 ? 'text-text-error' : 'text-text-heading'}`}>
                      {backupCodesCount} of 8 codes {backupCodesCount < 3 && ' (Low!)'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isEnabled ? (
                <Button
                  onClick={handleStartSetup}
                  disabled={isLoading}
                  className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold shadow-sm h-10 px-6 rounded-lg text-sm transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enable Two-Factor Auth
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRegenModal(true)}
                    className="border-border-default hover:bg-bg-sidebar-hover text-text-body font-semibold h-10 px-5 rounded-lg text-sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2 text-text-secondary" />
                    Regenerate Backup Codes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDisableModal(true)}
                    className="text-text-error hover:bg-sc-red-50 hover:text-sc-red-700 font-semibold h-10 px-5 rounded-lg text-sm transition-all"
                  >
                    Disable 2FA
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* SETUP STATE: STEP 1 (Scan QR) */}
        {setupStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSetupStep(null)}
                className="w-8 h-8 rounded-lg border border-border-default text-text-secondary hover:text-text-heading"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h4 className="font-semibold text-base text-text-heading">Step 1: Scan this QR code</h4>
                <p className="text-xs text-text-secondary">Set up your authenticator app</p>
              </div>
            </div>

            <p className="text-sm text-text-body leading-relaxed">
              Open Google Authenticator, Microsoft Authenticator, Authy, or any TOTP app. Tap the <span className="font-bold">+</span> or scan button and point your camera at this code.
            </p>

            {/* QR display container */}
            <div className="flex flex-col items-center justify-center p-6 bg-bg-secondary-panel rounded-xl border border-border-default w-fit mx-auto">
              {setupQrUrl ? (
                <img
                  src={setupQrUrl}
                  width={200}
                  height={200}
                  alt="Scan with authenticator app"
                  className="rounded-lg shadow-sm bg-white p-2 border border-border-subtle"
                />
              ) : (
                <div className="w-[200px] h-[200px] bg-bg-input animate-pulse rounded-lg flex items-center justify-center text-text-disabled">
                  Loading QR...
                </div>
              )}
            </div>

            {/* Manual entry fallback */}
            <div className="border-t border-border-subtle pt-4 space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Can't scan? Enter this code manually:</p>
              <div className="flex items-center justify-between gap-3 p-3 bg-bg-secondary-panel border border-border-default rounded-xl">
                <span className="font-mono text-sm tracking-widest font-semibold text-text-body select-all pl-2">
                  {setupSecret}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopySecret}
                  className="w-8 h-8 hover:bg-bg-sidebar-hover text-text-secondary hover:text-text-heading"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => setSetupStep(2)}
                className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold h-10 px-6 rounded-lg text-sm shadow-sm"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSetupStep(null)}
                className="border border-border-default text-text-body font-semibold h-10 px-5 rounded-lg text-sm hover:bg-bg-sidebar-hover"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {/* SETUP STATE: STEP 2 (Verify Token) */}
        {setupStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSetupStep(1); setVerificationError(''); }}
                className="w-8 h-8 rounded-lg border border-border-default text-text-secondary hover:text-text-heading"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h4 className="font-semibold text-base text-text-heading">Step 2: Enter the 6-digit code</h4>
                <p className="text-xs text-text-secondary">Confirm configuration validity</p>
              </div>
            </div>

            <p className="text-sm text-text-body leading-relaxed">
              Enter the 6-digit verification code shown in your authenticator app to complete the sync.
            </p>

            <div className="space-y-4">
              <div className="w-48 mx-auto relative">
                <Input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  autoFocus
                  value={verifyCodeInput}
                  onChange={(e) => {
                    setVerifyCodeInput(e.target.value.replace(/[^0-9]/g, ''));
                    setVerificationError('');
                  }}
                  className="w-full text-center text-2xl font-mono tracking-[0.2em] font-semibold h-12 bg-bg-input border-border-input focus:border-sc-purple-600 rounded-xl"
                />
              </div>

              {verificationError && (
                <div className="text-sm text-text-error text-center font-medium bg-sc-red-50 p-3 rounded-lg border border-sc-red-100 max-w-sm mx-auto flex items-center gap-2 justify-center">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {verificationError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleVerifySetup}
                disabled={verifyCodeInput.length !== 6 || isLoading}
                className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold h-10 px-6 rounded-lg text-sm shadow-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Enable
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setSetupStep(1); setVerificationError(''); }}
                className="border border-border-default text-text-body font-semibold h-10 px-5 rounded-lg text-sm hover:bg-bg-sidebar-hover"
              >
                Back
              </Button>
            </div>
          </motion.div>
        )}

        {/* SETUP STATE: STEP 3 (Backup Codes) */}
        {setupStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm space-y-6"
          >
            <div className="pb-4 border-b border-border-subtle">
              <h4 className="font-semibold text-base text-text-heading">Step 3: Save your backup codes</h4>
              <p className="text-xs text-text-secondary">Keep these secure as a fallback mechanism</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-sc-amber-50 border border-sc-amber-100 rounded-xl p-4 flex gap-3 text-sm text-text-warning">
              <AlertTriangle className="w-5 h-5 text-sc-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Store backup codes in a safe place!</strong>
                <span className="leading-relaxed mt-0.5 block text-xs">
                  Each code can only be used once. If you lose access to your authenticator app, these are your absolute only way back into your account.
                </span>
              </div>
            </div>

            {/* Codes Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {setupBackupCodes.map((code) => (
                <div
                  key={code}
                  className="font-mono text-center text-sm font-semibold tracking-wider bg-bg-secondary-panel text-text-body-strong py-2.5 px-4 rounded-lg border border-border-default hover:border-sc-purple-200 transition-colors"
                >
                  {code}
                </div>
              ))}
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleCopyBackupCodes(setupBackupCodes)}
                className="border-border-default hover:bg-bg-sidebar-hover text-text-body font-semibold h-10 px-5 rounded-lg text-sm"
              >
                {copiedCodes ? <Check className="w-4 h-4 mr-2 text-text-success" /> : <Copy className="w-4 h-4 mr-2 text-text-secondary" />}
                {copiedCodes ? 'Copied!' : 'Copy All Codes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadBackupCodes(setupBackupCodes)}
                className="border-border-default hover:bg-bg-sidebar-hover text-text-body font-semibold h-10 px-5 rounded-lg text-sm"
              >
                <Download className="w-4 h-4 mr-2 text-text-secondary" />
                Download as .txt
              </Button>
            </div>

            {/* Confirmation Checkbox */}
            <div className="pt-4 border-t border-border-subtle">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-text-body">
                <input
                  type="checkbox"
                  checked={codesSavedChecked}
                  onChange={(e) => setCodesSavedChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-sc-purple-600 focus:ring-sc-purple-500 border-border-default bg-bg-input mt-0.5 cursor-pointer"
                />
                <span className="leading-tight font-medium select-none">
                  I have saved my backup codes in a secure location and understand they cannot be retrieved again
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleCompleteSetup}
                disabled={!codesSavedChecked}
                className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold h-10 px-6 rounded-lg text-sm shadow-sm transition-opacity"
              >
                Done — Enable 2FA
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: REGENERATE BACKUP CODES */}
      <AnimatePresence>
        {showRegenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-modal border border-border-modal rounded-2xl p-6 w-full max-w-md shadow-sc-modal relative overflow-hidden text-text-body"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-sc-purple-600" />
              
              <h3 className="text-lg font-bold text-text-heading mb-2">Regenerate Backup Codes</h3>
              
              {newRegenedBackupCodes.length === 0 ? (
                <div className="space-y-4 mt-4">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Regenerating new backup codes will immediately invalidate all existing backup codes. For security, please verify your current 6-digit authenticator app code first.
                  </p>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-text-secondary uppercase">Authenticator Code</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={regenTokenInput}
                      onChange={(e) => {
                        setRegenTokenInput(e.target.value.replace(/[^0-9]/g, ''));
                        setRegenError('');
                      }}
                      className="text-center text-lg font-mono tracking-widest font-semibold h-10 bg-bg-input border-border-input"
                    />
                  </div>

                  {regenError && (
                    <div className="text-xs text-text-error bg-sc-red-50 p-2.5 rounded border border-sc-red-100 text-center font-medium">
                      {regenError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setShowRegenModal(false); setRegenTokenInput(''); setRegenError(''); }}
                      className="flex-1 border-border-default text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={regenTokenInput.length !== 6 || isRegenerating}
                      onClick={handleRegenerateCodes}
                      className="flex-1 bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold"
                    >
                      {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 mt-4">
                  {/* Warning Banner */}
                  <div className="bg-sc-amber-50 border border-sc-amber-100 rounded-xl p-3 flex gap-2.5 text-xs text-text-warning">
                    <AlertTriangle className="w-4 h-4 text-sc-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block">Store these new codes secure!</strong>
                      <span className="leading-relaxed block mt-0.5">
                        Your previous backup codes are now completely inactive. Copy or download these new codes immediately.
                      </span>
                    </div>
                  </div>

                  {/* Codes Grid */}
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    {newRegenedBackupCodes.map((code) => (
                      <div
                        key={code}
                        className="font-mono text-center text-xs font-bold bg-bg-secondary-panel text-text-body-strong py-2 border border-border-default rounded-md"
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  {/* Download Buttons */}
                  <div className="flex gap-2 justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyBackupCodes(newRegenedBackupCodes)}
                      className="border-border-default text-xs"
                    >
                      {copiedCodes ? <Check className="w-3.5 h-3.5 mr-1.5 text-text-success" /> : <Copy className="w-3.5 h-3.5 mr-1.5 text-text-secondary" />}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBackupCodes(newRegenedBackupCodes)}
                      className="border-border-default text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5 text-text-secondary" />
                      Download .txt
                    </Button>
                  </div>

                  {/* Confirm Saved Checkbox */}
                  <label className="flex items-start gap-2.5 pt-3 border-t border-border-subtle cursor-pointer text-xs text-text-body">
                    <input
                      type="checkbox"
                      checked={newCodesSavedChecked}
                      onChange={(e) => setNewCodesSavedChecked(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-sc-purple-600 border-border-default mt-0.5 cursor-pointer"
                    />
                    <span className="select-none leading-tight font-medium">
                      I have securely saved these new backup codes and confirm they are active
                    </span>
                  </label>

                  <Button
                    disabled={!newCodesSavedChecked}
                    onClick={handleCompleteRegen}
                    className="w-full bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold text-xs py-2 h-9 rounded-lg"
                  >
                    Complete & Return
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DISABLE TWO-FACTOR AUTH */}
      <AnimatePresence>
        {showDisableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-modal border border-sc-red-200 rounded-2xl p-6 w-full max-w-md shadow-sc-modal relative overflow-hidden text-text-body"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-sc-red-600" />
              
              <h3 className="text-lg font-bold text-text-heading mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-sc-red-650" /> Disable Two-Factor Auth
              </h3>
              
              <p className="text-sm leading-relaxed text-text-secondary mt-2 mb-4">
                Disabling 2FA will lower your account security rating. To authorize this change, please enter your <strong className="text-text-heading">current password</strong> and a <strong className="text-text-heading">6-digit TOTP code</strong>.
              </p>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-text-secondary uppercase">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input
                      type="password"
                      placeholder="Your password"
                      value={disablePasswordInput}
                      onChange={(e) => {
                        setDisablePasswordInput(e.target.value);
                        setDisableError('');
                      }}
                      className="pl-9 bg-bg-input border-border-input"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-text-secondary uppercase">6-Digit Code</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={disableTokenInput}
                    onChange={(e) => {
                      setDisableTokenInput(e.target.value.replace(/[^0-9]/g, ''));
                      setDisableError('');
                    }}
                    className="text-center font-mono tracking-widest font-semibold h-10 bg-bg-input border-border-input"
                  />
                </div>

                {disableError && (
                  <div className="text-xs text-text-error bg-sc-red-50 p-2.5 rounded border border-sc-red-100 text-center font-medium">
                    {disableError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDisableModal(false);
                      setDisablePasswordInput('');
                      setDisableTokenInput('');
                      setDisableError('');
                    }}
                    className="flex-1 border-border-default text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!disablePasswordInput || disableTokenInput.length !== 6 || isDisabling}
                    onClick={handleDisable2FA}
                    className="flex-1 bg-sc-red-650 hover:bg-sc-red-700 text-white text-xs font-bold"
                  >
                    {isDisabling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Deactivate 2FA
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
