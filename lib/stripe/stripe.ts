import Stripe from 'stripe';

// Create a fallback stripe instance when STRIPE_SECRET_KEY is missing
const createStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY environment variable is not set - payment features will be disabled');
    // Return a mock stripe instance for development
    return {
      webhooks: {
        constructEvent: () => ({ type: 'test.event' }),
      },
      checkout: {
        sessions: {
          create: () => Promise.resolve({ url: '#' }),
        },
      },
    } as any;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
};

export const stripe = createStripeInstance();
