'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResellerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/superadmin');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      <p className="mt-4 text-sm text-slate-400">
        Redirigiendo al Panel de Administración Central...
      </p>
    </div>
  );
}
