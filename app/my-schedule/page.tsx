import Link from 'next/link';
import { MySchedule } from '@/components/my-schedule';

export default function MySchedulePage() {
  return <main className="mobile-schedule"><header><div><span>OFFLINE MEETING</span><strong>我的现场洽谈</strong></div><Link href="/matching">返回后台</Link></header><MySchedule/></main>;
}
