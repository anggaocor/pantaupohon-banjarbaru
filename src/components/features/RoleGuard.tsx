'use client';

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleGuard({ children, allow }: {
  children: React.ReactNode;
  allow: string[];
}) {

  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.push('/login');

      // Ambil role dari tabel profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!profile || !allow.includes(profile.role)) {
        return router.push('/403');
      }

      setRole(profile.role);
    }

    check();
  }, [router, allow]);

  if (!role) return <p>Checking access...</p>;

  return <>{children}</>;
}
