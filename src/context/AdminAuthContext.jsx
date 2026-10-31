'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Login from '../components/Login';

export const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:4000';
export const currency = '$';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
      if (activeToken) {
        await axios.post(
          backendUrl + '/api/v1/user/logout',
          {},
          { headers: { token: activeToken } }
        );
      }
    } catch (error) {
      console.error('Logout error:', error?.response?.data || error.message);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken('');
      setAdminUser(null);
      toast.info('Logged out from Admin / Seller panel');
      router.push('/login');
    }
  }, [backendUrl, router, token]);

  // Read stored token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      if (stored) {
        try {
          const payload = JSON.parse(atob(stored.split('.')[1]));
          const expiryTime = payload.exp * 1000 - Date.now();
          if (expiryTime > 0) {
            setToken(stored);
            setAdminUser(payload);
          } else {
            localStorage.removeItem('token');
          }
        } catch (e) {
          setToken(stored);
        }
      }
      setInitialized(true);
    }
  }, []);

  // Sync token state and decode adminUser payload
  useEffect(() => {
    if (!token) {
      setAdminUser(null);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAdminUser(payload);

      const expiryTime = payload.exp * 1000 - Date.now();
      if (expiryTime <= 0) {
        logout();
        return;
      }

      const timer = setTimeout(() => {
        logout();
      }, expiryTime);

      return () => clearTimeout(timer);
    } catch (e) {
      // ignore
    }
  }, [token, logout]);

  // If logged in and on an auth page, redirect to /dashboard
  useEffect(() => {
    if (token && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [token, pathname, router]);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <AdminAuthContext.Provider
      value={{ token, setToken, adminUser, initialized, logout, backendUrl, currency }}
    >
      <div className="bg-[#FAF8F5] dark:bg-[#12100E] text-[#1C1917] dark:text-[#FAF8F5] min-h-screen font-sans selection:bg-[#1C1917] selection:text-white">
        <ToastContainer
          position="top-right"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          theme="light"
        />
        {isAuthPage ? (
          children
        ) : !token ? (
          <Login setToken={setToken} />
        ) : (
          <div className="h-screen flex flex-col overflow-hidden bg-[#FAF8F5] dark:bg-[#12100E]">
            <Navbar />
            <div className="flex-1 flex w-full min-h-0 overflow-hidden">
              <Sidebar />
              <main className="flex-1 min-w-0 h-full p-4 sm:p-6 lg:p-8 bg-[#FAF8F5] dark:bg-[#12100E] text-[#1C1917] dark:text-[#FAF8F5] overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </div>
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
