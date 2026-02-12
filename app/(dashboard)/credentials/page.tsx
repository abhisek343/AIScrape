import { Suspense } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LockKeyholeIcon, ShieldIcon, ShieldOffIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import CreateCredentialDialog from '@/app/(dashboard)/credentials/_components/create-credential-dialog';
import DeleteCredentialDialog from '@/app/(dashboard)/credentials/_components/delete-credential-dialog';

import { getCredentialsForUser } from '@/actions/credentials/get-credentials-for-user';

export default function CredentialsPage() {
  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Credentials</h1>
          <p className="text-muted-foreground">Manage your credentials</p>
        </div>
        <CreateCredentialDialog />
      </div>

      <div className="h-full py-6 space-y-8">
        <Alert>
          <ShieldIcon className="h-4 w-4 stroke-primary" />
          <AlertTitle className="text-primary">Encryption</AlertTitle>
          <AlertDescription>All information is securely encrypted, ensuring your data remains safe</AlertDescription>
        </Alert>

        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <UserCredentials />
        </Suspense>
      </div>
    </div>
  );
}

async function UserCredentials() {
  const data = await getCredentialsForUser();

  if (!data) {
    return (
      <Alert variant="destructive">
        <ShieldOffIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const { credentials } = data;

  if (credentials.length === 0) {
    return (
      <Card className="w-full p-4 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <ShieldIcon className="h-8 w-8 stroke-muted-foreground" />
          <p className="text-muted-foreground">No credentials found</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {credentials.map((credential: { id: string; name: string; createdAt: Date }) => {
        const createdAt = formatDistanceToNow(credential.createdAt, { addSuffix: true });

        return (
          <Card key={credential.id} className="w-full p-4 flex justify-between">
            <div className="flex gap-2 items-center">
              <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center">
                <LockKeyholeIcon size={18} className="stroke-primary" />
              </div>
              <div>
                <p className="font-bold">{credential.name}</p>
                <p className="text-xs text-muted-foreground">{createdAt}</p>
              </div>
            </div>

            <DeleteCredentialDialog name={credential.name} />
          </Card>
        );
      })}
    </div>
  );
}
