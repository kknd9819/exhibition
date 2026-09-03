import type { Metadata } from 'next';
import './globals.css';

const metadataBase = new URL(process.env.SITE_ORIGIN ?? 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase,
  title: '会展中枢 · 集团会展管理系统',
  description: '面向会展集团的多项目运营、门户、报名、企业与数据管理平台。',
  openGraph: {
    title: '会展中枢 · 集团会展管理系统',
    description: '集团内部多展会管理、门户发布、报名、展商、审核与数据分析 Alpha。',
    images: [new URL('/og.png', metadataBase).toString()],
  },
  twitter: {
    card: 'summary_large_image',
    title: '会展中枢 · 集团会展管理系统',
    description: '集团内部多展会管理、门户发布、报名、展商、审核与数据分析 Alpha。',
    images: [new URL('/og.png', metadataBase).toString()],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
