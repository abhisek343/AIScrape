import { SignIn } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const user = await currentUser();
  
  // If user is already signed in, redirect to dashboard
  if (user) {
    redirect('/home');
  }
  
  return <SignIn fallbackRedirectUrl="/home" />;
}
