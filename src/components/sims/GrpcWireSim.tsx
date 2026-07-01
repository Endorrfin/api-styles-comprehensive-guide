import { useMemo, useState } from 'react';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';
import { DEFAULT_ARTICLE, ID_CHOICES, SCHEMA, TAG_POOL, encode, hex } from '../../lib/grpc';

/*
 * GrpcWireSim — the signature interactive for m10 (CLAUDE.md §6). Thin renderer over the pure encoder in
 * lib/grpc.ts: edit an Article's fields and watch it serialise to protobuf bytes — tag (field<<3|wire),
 * length prefix, value — with proto3 dropping default values and the whole thing sized against JSON.
 * No timers → SSR-safe by construction.
 */

const typeLabel = (t: string): string => (t === 'repeated-string' ? 'repeated string' : t);

export function GrpcWireSim() {
  const { t } = useLang();
  const [id, setId] = useState<number>(DEFAULT_ARTICLE.id);
  const [title, setTitle] = useState<string>(DEFAULT_ARTICLE.title);
  const [tags, setTags] = useState<string[]>(DEFAULT_ARTICLE.tags);

  const result = useMemo(() => encode({ id, title, tags }), [id, title, tags]);
  const pct = result.jsonBytes > 0 ? (result.totalBytes / result.jsonBytes) * 100 : 0;
  const smaller = result.jsonBytes > 0 ? Math.round((1 - result.totalBytes / result.jsonBytes) * 100) : 0;

  const toggleTag = (tagVal: string) =>
    setTags((cur) => (cur.includes(tagVal) ? cur.filter((x) => x !== tagVal) : TAG_POOL.filter((p) => cur.includes(p) || p === tagVal)));
  const reset = () => {
    setId(DEFAULT_ARTICLE.id);
    setTitle(DEFAULT_ARTICLE.title);
    setTags(DEFAULT_ARTICLE.tags);
  };

  return (
    <div className="gw" role="group" aria-label={t({ en: 'gRPC / protobuf wire encoder', uk: 'Кодувальник gRPC / protobuf на дроті' })}>
      {/* The schema both sides compile against */}
      <pre className="gw-schema mono" aria-hidden="true">
        <span className="gw-kw">message</span> Article {'{'}
        {'\n'}
        {SCHEMA.map((f) => (
          <span key={f.num}>
            {'  '}
            <span className="gw-kw">{typeLabel(f.type)}</span> {f.name} = {f.num};{'\n'}
          </span>
        ))}
        {'}'}
      </pre>

      {/* Field controls */}
      <div className="gw-controls">
        <div className="gw-field">
          <span className="gw-field-label mono">id</span>
          <div className="gw-ids">
            {ID_CHOICES.map((n) => (
              <button key={n} type="button" className={cx('gw-id', id === n && 'on')} aria-pressed={id === n} onClick={() => setId(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="gw-field">
          <span className="gw-field-label mono">title</span>
          <input
            className="gw-title-input"
            type="text"
            value={title}
            maxLength={16}
            spellCheck={false}
            aria-label={t({ en: 'title value', uk: 'значення title' })}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="gw-field">
          <span className="gw-field-label mono">tags</span>
          <div className="gw-tags">
            {TAG_POOL.map((tg) => (
              <button key={tg} type="button" className={cx('gw-tag', tags.includes(tg) && 'on')} aria-pressed={tags.includes(tg)} onClick={() => toggleTag(tg)}>
                {tg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The bytes on the wire */}
      <div className="gw-stream">
        {result.fields.map((f, i) => (
          <div className="gw-record" key={`${f.num}-${i}`}>
            <div className="gw-record-head">
              <span className="gw-record-name mono">
                #{f.num} {f.name}
              </span>
              <span className="gw-record-val">{f.display || '""'}</span>
              <span className="gw-record-wire dim mono">{f.wire === 0 ? 'varint' : 'len'}</span>
            </div>
            <div className="gw-bytes">
              {f.tagBytes.map((b, j) => (
                <span key={`t${j}`} className="gw-byte tag" title={t({ en: 'tag = (field << 3) | wire type', uk: 'tag = (field << 3) | wire type' })}>
                  {hex(b)}
                </span>
              ))}
              {f.lenBytes.map((b, j) => (
                <span key={`l${j}`} className="gw-byte len" title={t({ en: 'length prefix (varint)', uk: 'префікс довжини (varint)' })}>
                  {hex(b)}
                </span>
              ))}
              {f.valueBytes.map((b, j) => (
                <span key={`v${j}`} className="gw-byte val" title={t({ en: 'value bytes', uk: 'байти значення' })}>
                  {hex(b)}
                </span>
              ))}
            </div>
          </div>
        ))}
        {result.fields.length === 0 && (
          <p className="gw-empty dim">{t({ en: 'Every field is at its default — proto3 writes nothing to the wire.', uk: 'Кожне поле в дефолті — proto3 нічого не пише на дріт.' })}</p>
        )}
      </div>

      {/* proto3 default omission */}
      {result.omitted.length > 0 && (
        <p className="gw-omitted dim">
          {t({ en: 'Omitted (proto3 default, not on the wire):', uk: 'Пропущено (proto3 default, не на дроті):' })}{' '}
          {result.omitted.map((o, i) => (
            <span key={o.num}>
              {i > 0 && ', '}
              <span className="gw-omitted-name mono">{o.name}</span>
            </span>
          ))}
        </p>
      )}

      {/* Legend */}
      <div className="gw-legend" aria-hidden="true">
        <span className="gw-legend-item">
          <span className="gw-swatch tag" /> {t({ en: 'tag', uk: 'tag' })}
        </span>
        <span className="gw-legend-item">
          <span className="gw-swatch len" /> {t({ en: 'length', uk: 'довжина' })}
        </span>
        <span className="gw-legend-item">
          <span className="gw-swatch val" /> {t({ en: 'value', uk: 'значення' })}
        </span>
      </div>

      {/* Size vs JSON */}
      <div className="gw-size">
        <div className="gw-size-row">
          <span className="gw-size-tag mono">Protobuf</span>
          <span className="gw-bar">
            <span className="gw-bar-fill" style={{ width: `${pct}%`, background: 'var(--accent-2)' }} />
          </span>
          <span className="mono gw-size-n">{result.totalBytes} B</span>
        </div>
        <div className="gw-size-row">
          <span className="gw-size-tag mono">JSON</span>
          <span className="gw-bar">
            <span className="gw-bar-fill" style={{ width: '100%', background: 'var(--accent)' }} />
          </span>
          <span className="mono gw-size-n">{result.jsonBytes} B</span>
        </div>
        <div className="gw-size-foot">
          <span className="dim">
            {t({ en: 'Field numbers travel, not names', uk: 'Передаються номери полів, не назви' })}
            {result.totalBytes > 0 && smaller > 0 ? ` · ${smaller}% ${t({ en: 'smaller', uk: 'менше' })}` : ''}
          </span>
          <button type="button" className="btn gw-reset" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      {/* Live region for screen readers */}
      <p className="sr-only" aria-live="polite">
        {t({ en: 'Protobuf', uk: 'Protobuf' })} {result.totalBytes} {t({ en: 'bytes', uk: 'байтів' })}, JSON {result.jsonBytes}.{' '}
        {result.omitted.length} {t({ en: 'default fields omitted', uk: 'дефолтних полів пропущено' })}.
      </p>
    </div>
  );
}
