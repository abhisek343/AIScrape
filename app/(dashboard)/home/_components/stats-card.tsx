'use client';

import { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactCountUpWrapper from '@/components/react-count-up-wrapper';

interface Props {
  title: string;
  value: number;
  icon: React.ReactNode;
}

export default function StatsCard(props: Props) {
  return (
    <Card className="relative overflow-hidden h-full">
      <CardHeader className="flex pb-2">
        <CardTitle>{props.title}</CardTitle>
        {props.icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          <ReactCountUpWrapper value={props.value} />
        </div>
      </CardContent>
    </Card>
  );
}
