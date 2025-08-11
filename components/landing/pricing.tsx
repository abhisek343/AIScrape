'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    features: ['100 credits/month', 'Basic workflows', 'Email support'],
    height: 'h-[400px]'
  },
  {
    name: 'Pro',
    price: '$49/month',
    features: ['Unlimited credits', 'Advanced workflows', 'Priority support', 'API access'],
    height: 'h-[450px]',
    featured: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Everything in Pro', 'Dedicated infrastructure', 'SLA guarantees', 'Custom integrations'],
    height: 'h-[420px]'
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Simple, transparent pricing
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={tier.height}
            >
              <Card className={`h-full ${tier.featured ? 'border-emerald-400/60 shadow-lg' : ''}`}>
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="text-3xl font-bold mt-2">{tier.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full ${tier.featured ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`} variant={tier.featured ? 'default' : 'outline'}>Choose {tier.name}</Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
