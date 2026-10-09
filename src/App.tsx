import { useCallback } from 'react';
import TopBar from './components/TopBar';
import Hero from './components/Hero';
import Lab from './components/Lab';
import Definition from './components/Definition';
import ScaleTable from './components/ScaleTable';
import Challenge from './components/Challenge';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  const jump = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const y = el.getBoundingClientRect().top + window.scrollY - 66;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  return (
    <div className="app">
      <TopBar onJump={jump} />

      <main>
        <Hero onJump={jump} />

        <div className="band band-tint">
          <Lab />
        </div>

        <Definition />

        <div className="band band-tint">
          <ScaleTable />
        </div>

        <Challenge />
      </main>

      <Footer />
    </div>
  );
}
