'use client';

import { useHydrated } from '@/hooks/use-hydrated';
import CountUp from 'react-countup';

export default function ReactCountUpWrapper({ value }: { value: number }) {
  const mounted = useHydrated();

  if (!mounted) {
    return '-';
  }

  return <CountUp duration={0.5} preserveValue end={value} decimals={0} />;
}
