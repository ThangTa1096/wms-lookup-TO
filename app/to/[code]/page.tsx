'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type TO = {
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

type Log = {
  id: number;
  tracking: string;
  type_code: string | null;
  group_code: string | null;
  employee_email: string | null;
  scanned_at: string;
  wms_status: string | null;
};

export default function TODetailPage() {
  const params = useParams();
  const toCode = decodeURIComponent(String(params.code || ''));

  const [to, setTO] = useState<TO | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toCode) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [toRes, logsRes] = await Promise.all([
          supabase.from('transfer_orders').select('*').eq('to_code', toCode).maybeSingle(),
          supabase
            .from('scan_logs')
            .select('id,tracking,type_code,group_code,employee_email,scanned_at,wms_status')
            .eq('to_code', toCode)
            .order('scanned_at', { ascending: true })
            .limit(1000),
        ]);
        if (toRes.error) throw toRes.error;
        if (logsRes.error) throw logsRes.error;
        setTO(toRes.data);
        setLogs(logsRes.data || []);
      } catch (err: any) {
        setError(err?.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, [toCode]);

  function exportCSV() {
    if (!logs.length) return;
    const headers = ['STT', 'Tracking', 'Type', 'Group', 'Nhân viên', 'Thời gian', 'Trạng thái'];
    const rows = logs.map((l, i) => [
      i + 1,
      l.tracking,
      l.type_code || '',
      l.group_code || '',
      l.employee_email || '',
      new Date(l.scanned_at).toLocaleString('vi-VN'),
      l.wms_status || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p>Đang tải...</p>;
  if (error) return <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, color: '#991b1b' }}>❌ {error}</div>;
  if (!to) return <p>Không tìm thấy TO <b>{toCode}</b></p>;

  return (
    <div>
      <Link href="/to" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
        ← Danh sách TO
      </Link>

      <div style={{ marginTop: 12, padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontFamily: 'monospace' }}>{to.to_code}</h1>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              background: to.status === 'ACTIVE' ? '#dcfce7' : '#e2e8f0',
              color: to.status === 'ACTIVE' ? '#166534' : '#475569',
            }}
          >
            {to.status}
          </span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 15 }}>
          <span><b>Group:</b> {to.group_code}</span>
          <span><b>Số đơn:</b> {to.current_count}/{to.max_count}</span>
          <span><b>Tạo:</b> {new Date(to.created_at).toLocaleString('vi-VN')} bởi {to.created_by || '—'}</span>
          {to.closed_at && (
            <span><b>Đóng:</b> {new Date(to.closed_at).toLocaleString('vi-VN')} bởi {to.closed_by || '—'}</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Danh sách đơn ({logs.length})</h2>
        <button
          onClick={exportCSV}
          disabled={!logs.length}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: logs.length ? '#16a34a' : '#94a3b8',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: logs.length ? 'pointer' : 'not-allowed',
          }}
        >
          ⬇ Xuất Excel (CSV)
        </button>
      </div>

      <div style={{ marginTop: 12, background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>#</th>
              <th style={{ padding: 12 }}>Tracking</th>
              <th style={{ padding: 12 }}>Type</th>
              <th style={{ padding: 12 }}>Nhân viên</th>
              <th style={{ padding: 12 }}>Thời gian</th>
              <th style={{ padding: 12 }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#666' }}>
                  TO chưa có đơn nào
                </td>
              </tr>
            )}
            {logs.map((l, i) => (
              <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12, color: '#666' }}>{i + 1}</td>
                <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 700 }}>{l.tracking}</td>
                <td style={{ padding: 12 }}>{l.type_code}</td>
                <td style={{ padding: 12 }}>{l.employee_email}</td>
                <td style={{ padding: 12 }}>{new Date(l.scanned_at).toLocaleString('vi-VN')}</td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        l.wms_status === 'SUCCESS' ? '#dcfce7' :
                        l.wms_status === 'ALREADY_ARRIVED' ? '#fef3c7' : '#fee2e2',
                      color:
                        l.wms_status === 'SUCCESS' ? '#166534' :
                        l.wms_status === 'ALREADY_ARRIVED' ? '#92400e' : '#991b1b',
                    }}
                  >
                    {l.wms_status || 'UNKNOWN'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
