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
  const [typeByGroup, setTypeByGroup] = useState<string>('');

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

  // Lấy Type đại diện của Group (1 Group = 1 Type)
  useEffect(() => {
    if (!to?.group_code) return;
    (async () => {
      const { data } = await supabase
        .from('tracking_map')
        .select('type_code')
        .eq('group_code', to.group_code)
        .limit(1)
        .maybeSingle();
      setTypeByGroup(data?.type_code || '');
    })();
  }, [to?.group_code]);

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

  function printTOLabel() {
    if (!to) return;

    const code = to.to_code;
    const count = to.current_count;
    const max = to.max_count;
    const group = to.group_code;
    const type = typeByGroup || '';

    const qrData = encodeURIComponent(code);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}&margin=0`;

    const now = new Date().toLocaleString('vi-VN');

    const win = window.open('', '_blank', 'width=400,height=700');
    if (!win) {
      alert('Trình duyệt chặn popup. Cho phép popup từ trang này.');
      return;
    }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>In tem ${code}</title>
<style>
  @page { size: 50mm 100mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 50mm; height: 100mm;
    font-family: Arial, sans-serif; color: #000; background: #fff;
    display: flex; flex-direction: column;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .label-top {
    width: 100%; height: 50mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2mm; gap: 1mm;
  }
  .label-top .qr { width: 38mm; height: 38mm; display: block; }
  .label-top .code-small {
    font-family: 'Courier New', monospace; font-size: 8pt; font-weight: 700;
    text-align: center; letter-spacing: 0.3px; word-break: break-all; line-height: 1.1;
  }
  .fold-line {
    width: 100%; height: 0; border-top: 0.3mm dashed #999; position: relative;
  }
  .fold-line::after {
    content: '✂ gấp'; position: absolute; right: 1mm; top: -3mm;
    font-size: 5pt; color: #999; background: #fff; padding: 0 1mm;
  }
  .label-bottom {
    width: 100%; height: 50mm;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 3mm 2.5mm;
  }
  .label-bottom .header {
    text-align: center; border-bottom: 0.4mm solid #000;
    padding-bottom: 2mm; margin-bottom: 2mm;
  }
  .label-bottom .title {
    font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  }
  .label-bottom .group {
    font-size: 20pt; font-weight: 900; line-height: 1; margin-top: 1mm;
  }
  .label-bottom .body {
    flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2mm;
  }
  .label-bottom .type-row { text-align: center; }
  .label-bottom .type-label {
    font-size: 7pt; color: #555; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .label-bottom .type-value {
    font-size: 11pt; font-weight: 900; margin-top: 0.5mm; line-height: 1.15; word-break: break-word;
  }
  .label-bottom .row {
    display: flex; justify-content: space-between;
    font-size: 8pt; padding: 0.5mm 0;
  }
  .label-bottom .row .label { color: #444; }
  .label-bottom .row .value { font-weight: 700; }
  .label-bottom .footer {
    text-align: center; font-size: 6pt; color: #555;
    border-top: 0.2mm solid #ccc; padding-top: 1.5mm; margin-top: 1mm;
  }
</style>
</head>
<body>

  <div class="label-top">
    <img class="qr" src="${qrUrl}" alt="QR">
    <div class="code-small">${code}</div>
  </div>

  <div class="fold-line"></div>

  <div class="label-bottom">
    <div class="header">
      <div class="title">TRANSFER ORDER</div>
      <div class="group">GROUP ${group}</div>
    </div>
    <div class="body">
      <div class="type-row">
        <div class="type-label">Loại hàng</div>
        <div class="type-value">${type || '—'}</div>
      </div>
      <div class="row">
        <span class="label">Số đơn</span>
        <span class="value">${count} / ${max}</span>
      </div>
      <div class="row">
        <span class="label">Ngày tạo</span>
        <span class="value">${new Date(to.created_at).toLocaleDateString('vi-VN')}</span>
      </div>
    </div>
    <div class="footer">${now}</div>
  </div>

</body>
</html>
    `);
    win.document.close();

    win.onload = () => {
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch (e) {
          console.error('[Print]', e);
          setTimeout(() => win.close(), 1000);
        }
      }, 500);
    };

    win.onafterprint = () => {
      setTimeout(() => win.close(), 300);
    };
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={printTOLabel}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            🖨 In lại tem
          </button>
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
