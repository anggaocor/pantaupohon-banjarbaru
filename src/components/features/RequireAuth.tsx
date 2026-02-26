'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) return <div className="text-white p-4">Memuat...</div>;

  return <>{children}</>;
}
