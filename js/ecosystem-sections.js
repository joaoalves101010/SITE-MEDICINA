import {renderWordmark} from './wordmark.js';

// Editorial previews only. Access and activation remain on the product sites.
export const ATLAS_URL = 'https://themedatlas.vercel.app/';
export const LIBRARY_URL = 'https://themedlibrary.vercel.app/';
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const brand = name => `<div class="eco-brand" role="img" aria-label="the med ${name}"><span class="eco-wordmark" aria-hidden="true">${renderWordmark()}</span><span class="eco-suffix" aria-hidden="true">${name}</span></div>`;
const link = (url,label) => `<a class="eco-button" href="${url}" target="_blank" rel="noopener noreferrer"><span>${label}</span>${arrow}<span class="sr-only"> — abre em nova aba</span></a>`;

export function renderAtlasSection(){return `<section id="the-med-atlas" class="eco-section eco-atlas" aria-labelledby="eco-atlas-title">
 <header class="eco-topline">${brand('Atlas')}<p class="eco-kicker">ANATOMIA, EM TODAS AS DIMENSÕES</p></header>
 <div class="eco-grid">
  <div class="eco-copy"><p class="eco-overline">01 / UM NOVO OLHAR SOBRE O CORPO</p><h2 id="eco-atlas-title">Vá além da superfície.<br><i>Entenda por dentro.</i></h2><p class="eco-description">O corpo humano ganha uma nova perspectiva. Explore a anatomia em 3D, aproxime estruturas e conecte cada detalhe ao todo.</p>
   <ul class="eco-features"><li><span>01</span><div><h3>Explore por camadas.</h3><p>Sistemas e estruturas para observar de diferentes ângulos.</p></div></li><li><span>02</span><div><h3>Dê direção à curiosidade.</h3><p>Percursos de estudo e prática de identificação anatômica.</p></div></li></ul>
   ${link(ATLAS_URL,'Explorar o Atlas')}<p class="eco-access">Prévia educacional. Ativação pelo Club em preparação.</p>
  </div>
  <figure class="eco-preview eco-atlas-preview"><div class="eco-preview-heading"><span>DO TODO AO DETALHE</span><span>3D / ANATOMIA</span></div><div class="eco-video-frame"><video class="eco-atlas-video" controls muted loop playsinline preload="none" data-decorative-video poster="/assets/ecosystem/atlas-tour-poster.webp" width="3420" height="1786" aria-label="Demonstração do Atlas: exploração de estruturas anatômicas em 3D, sem áudio"><source src="/assets/ecosystem/atlas-tour.mp4" type="video/mp4">Seu navegador não reproduz este vídeo.</video><a class="eco-video-fallback" href="${ATLAS_URL}" target="_blank" rel="noopener noreferrer" hidden><img src="/assets/ecosystem/atlas-tour-poster.webp" alt="Prévia do Atlas com estruturas anatômicas em 3D. Abrir o Atlas em nova aba." width="3420" height="1786" loading="lazy" decoding="async"></a></div><figcaption><span>O Atlas por dentro.</span><span>Demonstração em vídeo · sem áudio</span></figcaption><div class="eco-atlas-index" aria-hidden="true"><span>Explorar</span><span>Movimentar</span><span>Estudar</span></div></figure>
 </div>
 <div class="eco-section-foot"><span>PARTE DO ECOSSISTEMA THE MED</span><span>Uma nova dimensão do seu aprendizado.</span></div>
<script type="module" src="/js/atlas-video.js"></script>
</section>`;}

export function renderLibrarySection(){return `<section id="the-med-library" class="eco-section eco-library" aria-labelledby="eco-library-title">
 <header class="eco-topline">${brand('Library')}<p class="eco-kicker">02 / CONHECIMENTO SEM FRONTEIRAS</p></header>
 <div class="eco-library-lead">
  <div class="eco-library-copy"><p class="eco-library-eyebrow">DA CURIOSIDADE À DESCOBERTA</p><h2 id="eco-library-title">Conhecimento<br>que abre<br><i>caminhos.</i></h2><p class="eco-library-description">Toda boa descoberta começa com uma pergunta. Encontre referências para ir mais fundo na sua formação.</p>${link(LIBRARY_URL,'Explorar a Library')}</div>
  <figure class="eco-preview eco-library-preview"><div class="eco-library-window"><div class="eco-library-window-label"><span>UM UNIVERSO DE REFERÊNCIAS</span><span aria-hidden="true">↗</span></div><a href="${LIBRARY_URL}" target="_blank" rel="noopener noreferrer" class="eco-image-link" aria-label="Conhecer o acervo da Library — abre em nova aba"><img src="/assets/ecosystem/library-acervo.webp" alt="Captura real da Library: acervo por tema, filtros de pesquisa e referências com suas fontes." width="1400" height="972" loading="lazy" decoding="async"></a><figcaption><span>Medicina. Diretrizes. Pesquisa.</span><span>Captura real da interface</span></figcaption></div><p class="eco-library-margin-note">Sua próxima referência pode abrir um novo horizonte.</p></figure>
 </div>
 <ol class="eco-library-path" aria-label="Possibilidades da Library"><li><span class="eco-library-number">01</span><div><h3>Descobrir.</h3><p>Explore temas de medicina, diretrizes e pesquisa científica.</p></div></li><li><span class="eco-library-number">02</span><div><h3>Aprofundar.</h3><p>Referências brasileiras e internacionais, com links para as fontes.</p></div></li><li><span class="eco-library-number">03</span><div><h3>Conectar.</h3><p>Organize referências em coleções e construa seu percurso de estudo.</p></div></li></ol>
 <footer class="eco-library-membership"><div class="eco-library-access-label"><span class="eco-library-access-mark" aria-hidden="true">✳</span><div><p>EXCLUSIVO PARA MEMBROS</p><strong>Club Plus &amp; Ultra</strong></div></div><p class="eco-access">Ativação pelo Club em preparação.<br>Texto completo e condições de acesso dependem de cada fonte.</p></footer>
</section>`;}
export const renderEcosystemSections = () => renderAtlasSection() + renderLibrarySection();
