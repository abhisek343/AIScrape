import { SignUp } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const user = await currentUser();
  
  // If user is already signed in, redirect to dashboard
  if (user) {
    redirect('/home');
  }
  
  return <SignUp fallbackRedirectUrl="/home" />;
}
