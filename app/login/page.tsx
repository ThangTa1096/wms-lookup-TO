'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <h1 style={{ marginTop: 0 }}>Đăng nhập</h1>
      <p style={{ color: '#666', marginTop: 0, fontSize: 14 }}>WMS Tra cứu — chỉ nhân viên nội bộ</p>

      <form onSubmit={handleLogin} style={{ marginTop: 20 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8, marginBottom: 16 }}
        />

        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Mật khẩu</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8, marginBottom: 16 }}
        />

        {error && (
          <div style={{ padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
            ❌ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 12, fontSize: 16, fontWeight: 700, background: loading ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
