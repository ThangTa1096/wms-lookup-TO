'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type TO = {
  id: number;
  to_code: string;
  group_code: string;
  status: string;
  current_count: number;
  max_count: number;
  created_at: string;
  closed_at: string | null;
  created_by: string | null;
  closed_by: string | null;
};

function todayStr() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export default function TOListPage() {
  const [tos, setTOs] = useState<TO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateStr, setDateStr] = useState(todayStr());
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('transfer_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (dateStr) query = query.like('to_code', `%-${dateStr}-%`);
      if (group) query = query.eq('group_code', group);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      setTOs(data || []);
    } catch (err: any) {
      setError(err?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [dateStr, group, status]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Danh sách TO</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
            Ngày (YYMMDD)
          </label>
          <input
            type="text"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            placeholder="261122"
            maxLength={6}
            style={{ padding: '8px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8, width: 120 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
            Group
          </label>
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="6"
            style={{ padding: '8px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8, width: 100 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>
            Trạng thái
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8, width: 140 }}
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: 15,
              fontWeight: 600,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, color: '#991b1b', marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>TO code</th>
              <th style={{ padding: 12 }}>Group</th>
              <th style={{ padding: 12 }}>Trạng thái</th>
              <th style={{ padding: 12 }}>Số đơn</th>
              <th style={{ padding: 12 }}>Tạo lúc</th>
              <th style={{ padding: 12 }}>Đóng lúc</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {!loading && tos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#666' }}>
                  Không có TO nào khớp điều kiện
                </td>
              </tr>
            )}
            {tos.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 700 }}>{t.to_code}</td>
                <td style={{ padding: 12 }}>{t.group_code}</td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      background: t.status === 'ACTIVE' ? '#dcfce7' : '#e2e8f0',
                      color: t.status === 'ACTIVE' ? '#166534' : '#475569',
                    }}
                  >
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: 12, fontWeight: 600 }}>{t.current_count}/{t.max_count}</td>
                <td style={{ padding: 12 }}>{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                <td style={{ padding: 12 }}>{t.closed_at ? new Date(t.closed_at).toLocaleString('vi-VN') : '—'}</td>
                <td style={{ padding: 12 }}>
                  <Link
                    href={`/to/${encodeURIComponent(t.to_code)}`}
                    style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Chi tiết →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: '#666', fontSize: 14, marginTop: 16 }}>
        Tổng: <b>{tos.length}</b> TO
      </p>
    </div>
  );
}
