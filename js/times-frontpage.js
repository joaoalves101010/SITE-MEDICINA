export const TIMES_PREVIEW_SOURCE_URL = 'https://wwwn.cdc.gov/phil/Details.aspx?pid=26041';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

/** Frozen, explicitly dated sample cover. Full reading stays on the public journal. */
export function renderTimesFrontpage(href) {
  const image = '<img class="times-editorial-frontpage" src="/assets/the-med-times-frontpage-004.svg" width="1000" height="1480" alt="THE MED TIMES: capa completa da edição 004, de 25 de outubro de 2026, com manchetes, colunas e fotografias de contexto." loading="lazy" decoding="async">';
  const preview = href
    ? `<a class="times-editorial-paper-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir o THE MED TIMES para leitura completa em nova aba. Prévia da edição 004, de 25 de outubro de 2026.">${image}</a>`
    : image;
  return `<figure class="times-editorial-paper" data-times-preview-edition="004" data-times-preview-date="2026-10-25">${preview}<figcaption class="times-editorial-paper-caption"><span>Prévia da edição 004 · 25/10/2026</span><a class="times-editorial-credits" href="/assets/the-med-times-frontpage-004-credits.txt" target="_blank" rel="noopener noreferrer">Créditos da prévia<span class="sr-only"> — abre em nova aba</span></a><p class="times-editorial-photo-notice">Foto do Aedes: <a href="${TIMES_PREVIEW_SOURCE_URL}" target="_blank" rel="noopener noreferrer">fonte gratuita CDC/PHIL<span class="sr-only"> — abre em nova aba</span></a>. O uso desta imagem não implica endosso do CDC, HHS ou governo dos Estados Unidos ao THE MED TIMES.</p></figcaption></figure>`;
}
