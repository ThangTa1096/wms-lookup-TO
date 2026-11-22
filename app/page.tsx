'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type ScanLog = {
  id: number;
  tracking: string;
  type_code: string | null;
  group_code: string | null;
  to_code: string | null;
  employee_email: string | null;
  scanned_at: string;
  wms_status: string | null;
};

type TOInfo = {
  to_code: string;
  group_code: string;
  status: string;
  current_count: number;
  max_count: number;
  created_at: string;
  closed_at: string | null;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ScanLog[] | null>(null);
  const [toInfo, setToInfo] = useState<TOInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setLogs(null);
    setToInfo(null);

    try {
      const isTO = q.toUpperCase().startsWith('TO-');
      if (isTO) {
        // Tìm theo TO code
        const [toRes, logsRes] = await Promise.all([
          supabase
            .from('transfer_orders')
            .select('to_code, group_code, status, current_count, max_count, created_at, closed_at')
            .eq('to_code', q)
            .maybeSingle(),
          supabase
            .from('scan_logs')
            .select('*')
            .eq('to_code', q)
            .order('scanned_at', { ascending: true })
            .limit(500),
        ]);
        if (toRes.error) throw toRes.error;
        if (logsRes.error) throw logsRes.error;
        setToInfo(toRes.data);
        setLogs(logsRes.data || []);
      } else {
        // Tìm theo tracking
        const { data, error } = await supabase
          .from('scan_logs')
          .select('*')
          .eq('tracking', q)
          .order('scanned_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setLogs(data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi truy vấn');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>WMS Tra cứu</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Nhập mã vận đơn (ví dụ SPXVN...) hoặc mã TO (ví dụ TO-6-261122-01)
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tracking hoặc TO code..."
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 8,
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', borderRadius: 8, color: '#991b1b' }}>
          ❌ {error}
        </div>
      )}

      {toInfo && (
        <div style={{ marginTop: 24, padding: 20, background: '#f1f5f9', borderRadius: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{toInfo.to_code}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 24, fontSize: 15 }}>
            <span><b>Group:</b> {toInfo.group_code}</span>
            <span><b>Trạng thái:</b> {toInfo.status}</span>
            <span><b>Số đơn:</b> {toInfo.current_count}/{toInfo.max_count}</span>
            <span><b>Tạo:</b> {new Date(toInfo.created_at).toLocaleString('vi-VN')}</span>
            {toInfo.closed_at && <span><b>Đóng:</b> {new Date(toInfo.closed_at).toLocaleString('vi-VN')}</span>}
          </div>
        </div>
      )}

      {logs !== null && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>
            {logs.length > 0 ? `${logs.length} kết quả` : 'Không tìm thấy kết quả'}
          </h2>
          {logs.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>Tracking</th>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>Group</th>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>Type</th>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>TO</th>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>Nhân viên</th>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>Thời gian</th>
                  <th style={{ padding: 10, borderBottom: '2px solid #e2e8f0' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10, fontFamily: 'monospace', fontWeight: 700 }}>{log.tracking}</td>
                    <td style={{ padding: 10 }}>{log.group_code}</td>
                    <td style={{ padding: 10 }}>{log.type_code}</td>
                    <td style={{ padding: 10, fontFamily: 'monospace' }}>{log.to_code || '—'}</td>
                    <td style={{ padding: 10 }}>{log.employee_email}</td>
                    <td style={{ padding: 10 }}>{new Date(log.scanned_at).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: 10 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            log.wms_status === 'SUCCESS' ? '#dcfce7' :
                            log.wms_status === 'ALREADY_ARRIVED' ? '#fef3c7' : '#fee2e2',
                          color:
                            log.wms_status === 'SUCCESS' ? '#166534' :
                            log.wms_status === 'ALREADY_ARRIVED' ? '#92400e' : '#991b1b',
                        }}
                      >
                        {log.wms_status || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}
