export function getAppUrl(path: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }
  const base = appUrl.replace(/\/+$/, '');
  const cleanedPath = path.replace(/^\/+/, '');
  return `${base}/${cleanedPath}`;
}
