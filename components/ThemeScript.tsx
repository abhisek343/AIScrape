'use client';

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (!theme && prefersDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);
  return null;
}
