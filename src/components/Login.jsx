'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button, Input, Card } from "./ui";

const Login = ({ setToken: propSetToken, initialMode = "login" }) => {
  const { setToken: contextSetToken, backendUrl } = useAdminAuth();
  const setToken = propSetToken || contextSetToken;
  const router = useRouter();

  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA Verification State
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlMode = new URLSearchParams(window.location.search).get("mode");
      if (urlMode === "register") {
        setMode("register");
      } else if (urlMode === "login") {
        setMode("login");
      }
    }
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        if (password.trim().length < 8) {
          toast.error("Password must be at least 8 characters");
          setLoading(false);
          return;
        }

        const res = await axios.post(backendUrl + "/api/v1/user/register-seller", {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          storeName: storeName.trim(),
          phone: phone.trim(),
        });

        if (res.data.success) {
          toast.success("Seller account registered successfully! Welcome to your dashboard.");
          const tokenData = res.data.data;
          if (typeof window !== "undefined") {
            localStorage.setItem("token", tokenData);
          }
          if (setToken) {
            setToken(tokenData);
          }
          router.push("/dashboard");
        } else {
          toast.error(res.data.message || "Failed to register seller");
        }
      } else {
        const res = await axios.post(backendUrl + "/api/v1/user/admin", {
          email: email.trim(),
          password: password.trim(),
        });

        if (res.data.success) {
          if (res.data.data?.requires2FA) {
            setTempToken(res.data.data.tempToken);
            setIs2FAActive(true);
            setTwoFactorCode("");
            setIsBackupMode(false);
            toast.info("Two-Factor Authentication required. Please enter your code.");
            setLoading(false);
            return;
          }

          toast.success("Welcome back! Mission Control ready.");
          const tokenData = res.data.data;
          if (typeof window !== "undefined") {
            localStorage.setItem("token", tokenData);
          }
          if (setToken) {
            setToken(tokenData);
          }
          router.push("/dashboard");
        } else {
          toast.error(res.data.message);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerify2FAHandler = async (e) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      toast.error(isBackupMode ? "Please enter your backup code" : "Please enter the 6-digit code");
      return;
    }

    setLoading2FA(true);
    try {
      const res = await axios.post(backendUrl + "/api/v1/user/2fa/verify-login", {
        tempToken,
        code: twoFactorCode.trim(),
        isBackupCode: isBackupMode,
      });

      if (res.data.success) {
        toast.success("Security verified! Access granted.");
        const tokenData = res.data.data;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", tokenData);
        }
        if (setToken) {
          setToken(tokenData);
        }
        setIs2FAActive(false);
        router.push("/dashboard");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "2FA verification failed. Please check your code."
      );
    } finally {
      setLoading2FA(false);
    }
  };

  if (is2FAActive) {
    return (
      <div className="min-h-screen flex justify-center items-center w-full bg-[#FAF8F5] py-12 px-4 sm:px-6">
        <div className="bg-white shadow-[0_12px_32px_-4px_rgba(28,25,23,0.08)] rounded-2xl px-8 py-9 max-w-md w-full border border-[#E7E3D9]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E7E3D9] text-[#B08D57] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-normal text-[#1C1917] tracking-tight">
              2FA Verification
            </h2>
            <p className="text-xs text-[#78716C] mt-1 font-sans">
              {isBackupMode
                ? "Enter one of your 8-character recovery backup codes"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          <form onSubmit={onVerify2FAHandler} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#44403C] uppercase tracking-wider mb-1.5">
                {isBackupMode ? "Recovery Backup Code" : "6-Digit Security Code"}
              </label>
              <input
                type="text"
                autoFocus
                maxLength={isBackupMode ? 12 : 6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder={isBackupMode ? "XXXX-XXXX" : "123456"}
                className="w-full px-4 py-3 text-center text-xl tracking-[0.3em] font-mono bg-[#FAF8F5] border border-[#E7E3D9] rounded-md focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 outline-none text-[#1C1917]"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading2FA}
              variant="primary"
              size="lg"
              className="w-full mt-2"
            >
              Verify &amp; Sign In
            </Button>

            <div className="flex flex-col gap-2 pt-3 text-center border-t border-[#E7E3D9] mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsBackupMode(!isBackupMode);
                  setTwoFactorCode("");
                }}
                className="text-xs text-[#78716C] hover:text-[#1C1917] underline cursor-pointer"
              >
                {isBackupMode
                  ? "Use 6-digit Authenticator code instead"
                  : "Lost phone? Use a recovery backup code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIs2FAActive(false);
                  setTempToken("");
                  setTwoFactorCode("");
                }}
                className="text-xs text-[#A8A29E] hover:text-[#1C1917] cursor-pointer mt-1"
              >
                &larr; Back to sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center w-full bg-[#FAF8F5] py-12 px-4 sm:px-6">
      <div className="bg-white shadow-[0_12px_32px_-4px_rgba(28,25,23,0.08)] rounded-2xl px-8 py-9 max-w-md w-full border border-[#E7E3D9]">
        {/* Brand Eyebrow */}
        <div className="text-center mb-6">
          <span className="font-serif text-2xl tracking-[0.24em] font-semibold text-[#1C1917] uppercase block">
            Vellora
          </span>
          <span className="text-[10px] tracking-[0.3em] text-[#78716C] uppercase font-sans font-medium">
            Control Room &bull; Atelier Desk
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E7E3D9] mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 pb-3 text-xs uppercase tracking-[0.14em] font-medium text-center border-b-2 transition-all cursor-pointer ${
              mode === "login"
                ? "border-[#B08D57] text-[#1C1917] font-semibold"
                : "border-transparent text-[#A8A29E] hover:text-[#1C1917]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 pb-3 text-xs uppercase tracking-[0.14em] font-medium text-center border-b-2 transition-all cursor-pointer ${
              mode === "register"
                ? "border-[#B08D57] text-[#1C1917] font-semibold"
                : "border-transparent text-[#A8A29E] hover:text-[#1C1917]"
            }`}
          >
            Register as Seller
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-normal text-[#1C1917] tracking-tight">
            {mode === "login" ? "Portal Sign In" : "Seller Registration"}
          </h1>
          <p className="text-xs text-[#78716C] mt-1 font-sans">
            {mode === "login"
              ? "Access administrative control, order fulfillment, and metrics."
              : "Register your boutique brand to publish collections on Vellora."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmitHandler} className="space-y-4">
          {mode === "register" && (
            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
            />
          )}

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={mode === "login" ? "concierge@vellora.com" : "boutique@example.com"}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "Minimum 8 characters" : "••••••••"}
            hint={mode === "register" ? "Must be at least 8 characters long" : undefined}
          />

          {mode === "register" && (
            <>
              <Input
                label="Store / Brand Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Maison Atelier"
                hint="Optional"
              />

              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                hint="Optional"
              />
            </>
          )}

          <Button
            type="submit"
            loading={loading}
            variant="primary"
            size="lg"
            magnetic
            className="w-full mt-3"
          >
            {mode === "register" ? "Register Seller Account" : "Access Control Room"}
          </Button>
        </form>

        {/* Footer switch prompt */}
        <div className="mt-6 pt-5 border-t border-[#E7E3D9] text-center text-xs text-[#78716C]">
          {mode === "login" ? (
            <p>
              Want to curate on Vellora?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-medium text-[#1C1917] hover:text-[#B08D57] transition-colors cursor-pointer underline ml-1"
              >
                Register as Seller
              </button>
            </p>
          ) : (
            <p>
              Already an authorized curator or director?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-medium text-[#1C1917] hover:text-[#B08D57] transition-colors cursor-pointer underline ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
