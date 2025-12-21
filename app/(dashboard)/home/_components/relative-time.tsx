"use client";

import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface RelativeTimeProps {
    date: Date | string;
    suffix?: string;
}

export default function RelativeTime({ date, suffix = 'ago' }: RelativeTimeProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by showing nothing until client-side mount
    if (!mounted) {
        return <span>recently</span>;
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return <span>{formatDistanceToNow(dateObj)} {suffix}</span>;
}
