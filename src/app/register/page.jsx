'use client';

import React, { useEffect } from 'react';
import Login from '../../components/Login';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { token, initialized } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && token) {
      router.replace('/dashboard');
    }
  }, [initialized, token, router]);

  return <Login initialMode="register" />;
}
