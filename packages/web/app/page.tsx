import { Features } from '@/components/sections/features';
import { Hero } from '@/components/sections/hero';
import { QuickStart } from '@/components/sections/quick-start';
import { SiteFooter } from '@/components/sections/site-footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Hero />
      <Features />
      <QuickStart />
      <SiteFooter />
    </main>
  );
}
