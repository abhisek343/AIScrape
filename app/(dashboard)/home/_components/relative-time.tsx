"use client";

import { formatDistanceToNow } from 'date-fns';
import { useHydrated } from '@/hooks/use-hydrated';

interface RelativeTimeProps {
    date: Date | string;
    suffix?: string;
}

export default function RelativeTime({ date, suffix = 'ago' }: RelativeTimeProps) {
    const mounted = useHydrated();

    if (!mounted) {
        return <span>recently</span>;
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return <span>{formatDistanceToNow(dateObj)} {suffix}</span>;
}
