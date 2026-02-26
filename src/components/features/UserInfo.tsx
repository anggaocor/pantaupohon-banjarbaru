'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string | null;
}

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? null,
        });
      }
    };
    getUser();
  }, []);

  return (
    <div className="mb-4 text-sm text-gray-400">
      {user ? <p>Login sebagai: <strong>{user.email}</strong></p> : <p>Memuat user...</p>}
    </div>
  );
}
