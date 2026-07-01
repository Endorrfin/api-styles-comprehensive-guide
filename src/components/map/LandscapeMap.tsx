import { modulesBySection, sections, COUNTS } from '../../data/concepts';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { hrefModule } from '../../lib/hashRouter';

export function LandscapeMap() {
  const { t } = useLang();
  return (
    <div className="content map">
      <section className="map-hero">
        <p className="map-eyebrow">{t(ui.brandSubtitle)}</p>
        <h1>
          {t({
            en: 'The architectural styles for building APIs',
            uk: 'Архітектурні стилі побудови API',
          })}
        </h1>
        <p className="map-lede">
          {t({
            en: 'REST, GraphQL, gRPC, WebSockets, SSE, WebRTC, Webhooks, SOAP, OData — one place, decision-first. For each style: what it is, the model it assumes, its limits, its alternatives, and when to use it (and when not).',
            uk: 'REST, GraphQL, gRPC, WebSockets, SSE, WebRTC, Webhooks, SOAP, OData — в одному місці, рішення передусім. Для кожного стилю: що це, яку модель припускає, обмеження, альтернативи, і коли варто (а коли ні).',
          })}
        </p>
        <div className="map-cta">
          <a className="btn btn-primary" href={hrefModule('m5-rest')}>
            {t({ en: 'Start with REST →', uk: 'Почати з REST →' })}
          </a>
          <span className="dim">
            {COUNTS.sections} {t(ui.sectionsLabel)} · {COUNTS.modules} {t(ui.modulesLabel)} · {COUNTS.sims}{' '}
            {t(ui.simsLabel)}
          </span>
        </div>
      </section>

      <div className="map-overview">
        {sections.map((s) => {
          const mods = modulesBySection(s.id);
          return (
            <section className="map-section" key={s.id} style={{ ['--sec' as string]: s.accent }}>
              <header className="map-sec-head">
                <span className="side-roman" style={{ color: s.accent }}>
                  {s.roman}
                </span>
                <h2>{t(s.title)}</h2>
              </header>
              <div className="map-mods">
                {mods.map((m) => (
                  <a className="map-mod" href={hrefModule(m.id)} key={m.id}>
                    <span className="mono dim">{String(m.num).padStart(2, '0')}</span>
                    <span className="map-mod-title">{t(m.title)}</span>
                    {m.signature && <span className="side-star">★</span>}
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
