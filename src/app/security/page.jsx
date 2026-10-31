'use client';

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Button, Badge, PageHeader } from "../../components/ui";

export default function AdminSecurityPage() {
  const { token, backendUrl, adminUser } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [remainingBackupCodes, setRemainingBackupCodes] = useState(0);
  const [accountDetails, setAccountDetails] = useState(null);

  // Setup Modal State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Disable Modal State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  // Regenerate Backup Codes State
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [regenCode, setRegenCode] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  // Fetch current 2FA status
  const fetch2FAStatus = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/v1/user/2fa/status`, {
        headers: { token },
      });

      if (res.data.success) {
        setTwoFactorEnabled(res.data.data.twoFactorEnabled);
        setRemainingBackupCodes(res.data.data.remainingBackupCodes || 0);
        setAccountDetails(res.data.data.user);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load 2FA status"
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    fetch2FAStatus();
  }, [fetch2FAStatus]);

  // Start 2FA Setup
  const handleStartSetup = async () => {
    try {
      setSetupLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/2fa/setup`,
        {},
        { headers: { token } }
      );

      if (res.data.success) {
        setQrCode(res.data.data.qrCode);
        setManualKey(res.data.data.manualEntryKey);
        setVerificationCode("");
        setSetupModalOpen(true);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to start 2FA setup"
      );
    } finally {
      setSetupLoading(false);
    }
  };

  // Verify and activate 2FA
  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    try {
      setSetupLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/2fa/verify-setup`,
        { code: verificationCode.trim() },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setTwoFactorEnabled(true);
        setSetupModalOpen(false);
        setBackupCodes(res.data.data.backupCodes || []);
        setShowBackupModal(true);
        fetch2FAStatus();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Invalid verification code. Please check your app."
      );
    } finally {
      setSetupLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!disablePassword.trim() && !disableCode.trim()) {
      toast.error("Please provide your password or 6-digit authenticator code");
      return;
    }

    try {
      setDisableLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/2fa/disable`,
        {
          password: disablePassword.trim(),
          code: disableCode.trim(),
        },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success("Two-Factor Authentication has been disabled");
        setTwoFactorEnabled(false);
        setDisableModalOpen(false);
        setDisablePassword("");
        setDisableCode("");
        fetch2FAStatus();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to disable 2FA"
      );
    } finally {
      setDisableLoading(false);
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    if (!regenCode.trim()) {
      toast.error("Please enter your 6-digit authenticator code");
      return;
    }

    try {
      setRegenLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/user/2fa/regenerate-backup-codes`,
        { code: regenCode.trim() },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setRegenModalOpen(false);
        setRegenCode("");
        setBackupCodes(res.data.data.backupCodes || []);
        setShowBackupModal(true);
        fetch2FAStatus();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to regenerate backup codes"
      );
    } finally {
      setRegenLoading(false);
    }
  };

  const copyToClipboard = (text, message = "Copied to clipboard!") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.info(message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-16 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Security &amp; Privilege Guard"
        subtitle="Enforce time-based one-time password (TOTP) authentication and safeguard administrative access."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Security & 2FA" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Info Box */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-hairline shadow-luxury h-fit">
          <div className="w-14 h-14 rounded-2xl bg-ink text-canvas flex items-center justify-center text-xl font-display font-semibold mb-4 border border-hairline shadow-luxury">
            {accountDetails?.name
              ? accountDetails.name.charAt(0).toUpperCase()
              : adminUser?.name
              ? adminUser.name.charAt(0).toUpperCase()
              : "A"}
          </div>
          <h2 className="text-base font-semibold text-ink font-display">
            {accountDetails?.name || adminUser?.name || "Executive Administrator"}
          </h2>
          <p className="text-xs text-ink-muted font-mono mt-0.5">
            {accountDetails?.email || adminUser?.email}
          </p>

          <div className="mt-4 pt-4 border-t border-hairline flex flex-col gap-2.5">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                Authorization Role
              </span>
              <p className="text-xs font-semibold text-ink capitalize mt-0.5">
                {accountDetails?.role || adminUser?.role || "Administrator"}
              </p>
            </div>
            {(accountDetails?.storeName || adminUser?.storeName) && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                  Merchant Store
                </span>
                <p className="text-xs font-medium text-ink mt-0.5">
                  {accountDetails?.storeName || adminUser?.storeName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2FA Main Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-xs p-6 sm:p-7 rounded-2xl border border-hairline shadow-luxury">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-ink font-display flex items-center gap-2.5">
                  Two-Factor Authentication (TOTP)
                  {twoFactorEnabled ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="default">Disabled</Badge>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed font-sans">
                  Require a 6-digit verification code from your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy) whenever accessing the Vellora Mission Control workspace.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-hairline">
              {twoFactorEnabled ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-emerald-950 text-xs sm:text-sm">
                    <svg
                      className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-emerald-900">
                        Your administrative account is protected with 2FA.
                      </p>
                      <p className="text-xs text-emerald-800 mt-1">
                        Unused emergency backup recovery codes:{" "}
                        <span className="font-bold">{remainingBackupCodes}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRegenModalOpen(true)}
                    >
                      Regenerate Backup Codes
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDisableModalOpen(true)}
                    >
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink font-display">
                      Protect Administrative Privileges
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5 font-sans">
                      Prevent unauthorized store and order modifications if credentials are compromised.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleStartSetup}
                    disabled={setupLoading}
                  >
                    {setupLoading ? "Generating..." : "Enable 2FA"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: SETUP 2FA */}
      {setupModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-hairline">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-hairline">
              <h3 className="text-lg font-medium text-ink font-display">
                Setup Admin 2FA
              </h3>
              <button
                onClick={() => setSetupModalOpen(false)}
                className="text-ink-muted hover:text-ink cursor-pointer text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <ol className="text-xs text-ink-muted space-y-1.5 mb-4 list-decimal list-inside font-sans">
              <li>Open <strong>Google Authenticator</strong> or <strong>Authy</strong>.</li>
              <li>Scan the QR code below or enter the manual key.</li>
              <li>Enter the 6-digit code generated by the app.</li>
            </ol>

            {qrCode && (
              <div className="flex flex-col items-center justify-center p-4 bg-canvas-subtle rounded-xl border border-hairline mb-4">
                <img
                  src={qrCode}
                  alt="Authenticator QR Code"
                  className="w-48 h-48 rounded-lg border border-hairline"
                />
                <div className="mt-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold mb-1">
                    Manual Secret Key
                  </p>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-hairline">
                    <code className="text-xs font-mono text-ink select-all">
                      {manualKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(manualKey, "Secret key copied!")}
                      className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifySetup} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 border border-hairline rounded-xl focus:border-accent focus:outline-none bg-white text-ink"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-hairline">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={setupLoading}
                >
                  {setupLoading ? "Verifying..." : "Verify & Activate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BACKUP CODES */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-hairline">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink font-display mb-1">
              Admin Emergency Recovery Codes
            </h3>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed font-sans">
              Store these single-use recovery codes in a secure password manager. If you lose access to your phone or authenticator app, these are the only way to recover access.
            </p>

            <div className="grid grid-cols-2 gap-2 bg-canvas-subtle p-4 rounded-xl border border-hairline mb-4">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="font-mono text-center text-xs py-1.5 px-2 bg-white rounded-lg border border-hairline text-ink tracking-wider font-semibold"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  copyToClipboard(
                    backupCodes.join("\n"),
                    "All recovery codes copied to clipboard!"
                  )
                }
                className="w-full"
              >
                Copy All Codes
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="w-full"
              >
                I Have Stored These Codes Safely
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISABLE 2FA */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-hairline">
            <h3 className="text-base font-medium text-ink font-display mb-1">
              Disable Two-Factor Authentication
            </h3>
            <p className="text-xs text-ink-muted mb-4 font-sans">
              Confirm your password or enter a 6-digit code to turn off 2FA protection.
            </p>

            <form onSubmit={handleDisable2FA} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-hairline rounded-xl text-sm focus:border-accent focus:outline-none bg-white text-ink"
                />
              </div>

              <div className="text-center text-xs text-ink-muted font-semibold my-1">OR</div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono px-3 py-2 border border-hairline rounded-xl text-sm focus:border-accent focus:outline-none bg-white text-ink"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-hairline">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="submit"
                  disabled={disableLoading}
                >
                  {disableLoading ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REGENERATE BACKUP CODES */}
      {regenModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-hairline">
            <h3 className="text-base font-medium text-ink font-display mb-1">
              Regenerate Backup Codes
            </h3>
            <p className="text-xs text-ink-muted mb-4 font-sans">
              Enter your 6-digit authenticator code to generate fresh recovery codes.
            </p>

            <form onSubmit={handleRegenerateBackupCodes} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  value={regenCode}
                  onChange={(e) => setRegenCode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono px-3 py-2 border border-hairline rounded-xl text-sm focus:border-accent focus:outline-none bg-white text-ink"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-hairline">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setRegenModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={regenLoading}
                >
                  {regenLoading ? "Generating..." : "Generate Codes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
