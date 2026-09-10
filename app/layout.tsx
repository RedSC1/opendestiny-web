import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'RED.SC · 工具间', description: '历法、命理与塔罗，一处从容的个人工具空间。' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="zh-CN"><body>{children}</body></html>; }
