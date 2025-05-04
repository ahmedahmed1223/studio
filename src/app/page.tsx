'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to the dashboard page on load
    redirect('/dashboard');
  }, []);

  // Render nothing while redirecting
  return null;
}
