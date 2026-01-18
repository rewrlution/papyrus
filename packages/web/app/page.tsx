import { Features } from '@/components/sections/features';
import { Footer } from '@/components/sections/footer';
import { Hero } from '@/components/sections/hero';
import { Privacy } from '@/components/sections/privacy';

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Privacy />
      <Footer />
    </main>
  );
}
