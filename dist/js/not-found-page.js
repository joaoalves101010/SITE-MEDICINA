import { renderWordmark } from './wordmark.js';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.4"/></svg>';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Dedicated document: the error route never initializes the homepage/scroll runtime. */
export function renderNotFoundDocument({ build = 'dev' } = {}) {
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#160e12"><meta name="robots" content="noindex,follow">
<meta name="interny-build" content="${escape(build)}">
<title>Página não encontrada — the med | Your Medical Journey</title>
<meta name="description" content="Um desvio não precisa ser um ponto final. Encontre um novo caminho no universo da THE MED.">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg?v=symbol09-small-20261024">
<link rel="preload" as="font" href="/assets/Roobert-Regular.woff2" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/not-found.css">
</head><body data-page="404" data-build="${escape(build)}">
<a class="nf-skip" href="#main">Pular para o conteúdo</a>
<div class="nf-page" data-not-found data-motion="running">
  <div class="nf-atmosphere" aria-hidden="true"></div>
  <header class="nf-header">
    <a class="nf-brand" href="/" aria-label="THE MED — início">${renderWordmark()}</a>
    <p class="nf-signature" lang="en">Your Medical<br>Journey</p>
    <a class="nf-header-link" href="/">Voltar ao início <span aria-hidden="true">↗</span></a>
  </header>
  <main id="main" class="nf-main" tabindex="-1">
    <div class="nf-copy">
      <p class="nf-eyebrow"><span aria-hidden="true"></span> 404 · UM DESVIO NO CAMINHO</p>
      <h1>Nem todo desvio<br>é um <em>ponto final.</em></h1>
      <p class="nf-description">Não encontramos esta página.<br>Mas há um universo de possibilidades<br class="nf-desktop-break"> esperando pelo seu próximo passo.</p>
      <div class="nf-actions">
        <a class="nf-primary" href="/"><span>Voltar ao início</span><span class="nf-arrow">${arrow}</span></a>
        <a class="nf-secondary" href="/#works">Explorar o ecossistema <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <div class="nf-art" data-not-found-art data-render-mode="fallback">
      <div class="nf-art-field" aria-hidden="true"></div>
      <div class="nf-code" aria-hidden="true"><span>4</span><span class="nf-zero">0</span><span>4</span></div>
      <div class="nf-orb-fallback nf-earth-fallback" aria-hidden="true"><span></span><i></i></div>
      <canvas class="nf-canvas hero-canvas" aria-hidden="true"></canvas>
      <div class="nf-orbit-label nf-orbit-label--top" aria-hidden="true"><span>404</span><i></i> ROTA NÃO ENCONTRADA</div>
      <div class="nf-orbit-label nf-orbit-label--bottom" aria-hidden="true"><i></i> NOVAS PERSPECTIVAS</div>
      <button class="nf-perspective" type="button" data-change-perspective hidden><span aria-hidden="true">↻</span> Mudar perspectiva</button>
      <span class="nf-earth-credit">Imagens: NASA / Blue Marble</span><span class="nf-sr" role="status" data-perspective-status></span>
    </div>
  </main>
  <footer class="nf-footer">
    <p><span class="nf-footer-star" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" stroke="currentColor" stroke-width="1.5"/></svg></span> Sua jornada continua.</p>
    <nav aria-label="Encontre um novo caminho"><a href="/modulos/pesquisa/">Pesquisa <span aria-hidden="true">↗</span></a><a href="/comunidade/">Comunidade <span aria-hidden="true">↗</span></a><a href="/percursos/">Percursos <span aria-hidden="true">↗</span></a></nav>
    <button class="nf-motion" type="button" data-toggle-motion aria-pressed="false" hidden><span class="nf-pause-icon" aria-hidden="true"></span><span data-motion-label>Pausar animações</span></button>
  </footer>
</div><script type="module" src="/js/not-found.js"></script>
</body></html>`;
}
