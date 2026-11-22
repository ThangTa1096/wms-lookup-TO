import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'WMS Tra cứu',
  description: 'Tra cứu TO và Tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc' }}>
        <nav style={{
          background: '#1e293b',
          color: '#fff',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          height: 56,
        }}>
          <Link href="/" style={{ color: '#fff', fontWeight: 800, fontSize: 18, textDecoration: 'none' }}>
            WMS Tra cứu
          </Link>
          <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: 15 }}>
            Tìm kiếm
          </Link>
          <Link href="/to" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: 15 }}>
            Danh sách TO
          </Link>
        </nav>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
