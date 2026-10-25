import { renderTimesFrontpage } from './times-frontpage.js';
import { PUBLIC_TIMES_URL } from './times-config.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const TIMES_SECTIONS = Object.freeze(['Pesquisa', 'Clínica', 'Saúde pública', 'Formação', 'Inovação', 'Instituições']);

/** Validate a configured destination, not a claim that it is published or public. */
export function resolvePublicTimesURL(value) {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':')) return null;
    if (/(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host)) return null;
    if (/(?:^|\.)(?:chatgpt\.com|chatgpt\.site|chatgpt\.app|openai\.com)$/.test(host)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Evergreen marketing copy with a separately dated sample cover; no live-feed claim. */
export function renderTimesEditorial({ publicUrl = PUBLIC_TIMES_URL } = {}) {
  const href = resolvePublicTimesURL(publicUrl);
  const action = href
    ? `<a class="times-editorial-button" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-describedby="times-editorial-access"><span>Ler o jornal</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.25"/></svg></a><p class="times-editorial-access" id="times-editorial-access">THE MED TIMES · abre em nova aba</p>`
    : '<p class="times-editorial-pending">Em breve</p><p class="times-editorial-access" id="times-editorial-access">Leitura disponível em breve</p>';

  return `<section id="the-med-times" class="times-editorial" aria-labelledby="times-editorial-title"><div class="times-editorial-composition">${renderTimesFrontpage(href)}<div class="times-editorial-copy"><p class="times-editorial-eyebrow">O jornal da THE MED</p><h2 id="times-editorial-title"><span>A medicina avança.</span><em>Sua visão também.</em></h2><p class="times-editorial-description">Pesquisa, prática clínica e inovação no mundo, em português e com as fontes à vista. Um jornal para ampliar seu repertório e entender o contexto por trás das descobertas.</p><div class="times-editorial-desk"><p class="times-editorial-desk-label">Seis editorias. Um olhar mais amplo.</p><ul class="times-editorial-sections" aria-label="Editorias do THE MED TIMES">${TIMES_SECTIONS.map(section => `<li>${escapeHtml(section)}</li>`).join('')}</ul></div><div class="times-editorial-action" data-times-availability="${href ? 'available' : 'coming-soon'}">${action}</div></div></div></section>`;
}
