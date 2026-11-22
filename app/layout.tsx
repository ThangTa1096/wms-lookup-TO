'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isLoginPage = pathname === '/login';

  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc' }}>
        {!isLoginPage && (
          <nav style={{
            background: '#1e293b', color: '#fff', padding: '0 32px',
            display: 'flex', alignItems: 'center', gap: 32, height: 56,
          }}>
            <Link href="/" style={{ color: '#fff', fontWeight: 800, fontSize: 18, textDecoration: 'none' }}>
              WMS Tra cứu
            </Link>
            <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: 15 }}>Tìm kiếm</Link>
            <Link href="/to" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: 15 }}>Danh sách TO</Link>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
              {email && <span style={{ color: '#94a3b8', fontSize: 14 }}>{email}</span>}
              <button
                onClick={handleLogout}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
              >
                Đăng xuất
              </button>
            </div>
          </nav>
        )}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
