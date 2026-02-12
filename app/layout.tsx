import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '盲人陪跑应用',
  description: '盲人陪跑志愿服务平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
