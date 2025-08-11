'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "AIScrape transformed our data collection process. We're now scraping millions of pages reliably.",
    name: "Jane Doe",
    role: "CTO, DataCorp",
    avatar: "/placeholder.svg?height=40&width=40"
  },
  {
    quote: "The visual builder is intuitive and powerful. We built complex workflows in hours, not days.",
    name: "John Smith",
    role: "Lead Developer, TechInc",
    avatar: "/placeholder.svg?height=40&width=40"
  },
  {
    quote: "Enterprise-grade reliability at startup prices. Highly recommended for scaling data operations.",
    name: "Alex Johnson",
    role: "Data Analyst, ScaleUp",
    avatar: "/placeholder.svg?height=40&width=40"
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-900/10">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-12"
        >
          What our customers say
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative border-emerald-200/40 dark:border-emerald-900/40">
                <Quote className="absolute top-4 left-4 h-8 w-8 text-emerald-500/20" />
                <CardContent className="pt-12 pb-6">
                  <p className="mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
