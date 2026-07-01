import { Suspense, lazy, useEffect, useRef } from 'react';
import { Footer } from './components/layout/Footer';
import { ProgressBar } from './components/layout/ProgressBar';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { useLang } from './i18n/lang';
import { ui } from './i18n/ui';
import { useRoute } from './lib/hashRouter';

const LandscapeMap = lazy(() => import('./components/map/LandscapeMap').then((m) => ({ default: m.LandscapeMap })));
const ModulePage = lazy(() => import('./components/module/ModulePage').then((m) => ({ default: m.ModulePage })));
const GlossaryPage = lazy(() => import('./components/pages/GlossaryPage').then((m) => ({ default: m.GlossaryPage })));
const MentalModelsPage = lazy(() => import('./components/pages/MentalModelsPage').then((m) => ({ default: m.MentalModelsPage })));
const ComingSoon = lazy(() => import('./components/pages/ComingSoon').then((m) => ({ default: m.ComingSoon })));

export function App() {
  const route = useRoute();
  const { t } = useLang();
  const firstRender = useRef(true);

  // a11y: move focus to the main landmark on route change (not initial load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById('main')?.focus();
  }, [route]);

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById('main');
          el?.focus();
          el?.scrollIntoView();
        }}
      >
        {t({ en: 'Skip to content', uk: 'До вмісту' })}
      </a>
      <ProgressBar />
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-col" id="main" tabIndex={-1}>
          <Suspense fallback={<div className="content" style={{ padding: '2rem', color: 'var(--tx3)' }}>Loading…</div>}>
            {route.name === 'map' && <LandscapeMap />}
            {route.name === 'module' && <ModulePage moduleId={route.moduleId} topicId={route.topicId} />}
            {route.name === 'mentalModels' && <MentalModelsPage />}
            {route.name === 'glossary' && <GlossaryPage term={route.term} />}
            {route.name === 'decide' && (
              <div className="content">
                <h1>{t(ui.decide)}</h1>
                <p className="muted">
                  {t({
                    en: 'The interactive style picker — answer a few questions about your boundary (latency, payload shape, streaming, browser reach, coupling) and it ranks the best-fit API styles. Shipping with module m24 (the decision framework).',
                    uk: 'Інтерактивний підбір стилю — дайте відповідь на кілька питань про ваш boundary (latency, форма payload, streaming, доступність у браузері, coupling), і він проранжує найкращі API-стилі. Вийде з модулем m24 (decision framework).',
                  })}
                </p>
                <ComingSoon />
              </div>
            )}
          </Suspense>
          <Footer />
        </main>
      </div>
    </div>
  );
}
