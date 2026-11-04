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
  <figure class="eco-preview eco-atlas-preview"><div class="eco-preview-heading"><span>DO TODO AO DETALHE</span><span>3D / ANATOMIA</span></div><a href="${ATLAS_URL}" target="_blank" rel="noopener noreferrer" class="eco-image-link" aria-label="Conhecer o Atlas, com anatomia em 3D — abre em nova aba"><img src="/assets/ecosystem/atlas-study.webp" alt="Captura real do Atlas: coração em 3D e percurso de estudo de órgãos essenciais." width="1280" height="900" loading="lazy" decoding="async"></a><figcaption><span>O Atlas por dentro.</span><span>Captura da interface · prévia</span></figcaption><div class="eco-atlas-index" aria-hidden="true"><span>Explorar</span><span>Movimentar</span><span>Estudar</span></div></figure>
 </div>
 <div class="eco-section-foot"><span>PARTE DO ECOSSISTEMA THE MED</span><span>Uma nova dimensão do seu aprendizado.</span></div>
</section>`;}

export function renderLibrarySection(){return `<section id="the-med-library" class="eco-section eco-library" aria-labelledby="eco-library-title">
 <header class="eco-topline">${brand('Library')}<p class="eco-kicker">CONHECIMENTO SEM FRONTEIRAS</p></header>
 <div class="eco-grid">
  <div class="eco-copy"><p class="eco-overline">02 / DA PERGUNTA À DESCOBERTA</p><h2 id="eco-library-title">Sua próxima referência.<br><i>Um novo horizonte.</i></h2><p class="eco-description">Temas de medicina, diretrizes e pesquisa científica. Um lugar para encontrar fontes, aprofundar perguntas e organizar o que faz sentido para a sua formação.</p>
   <ul class="eco-features"><li><span>01</span><div><h3>Conhecimento com origem.</h3><p>Referências brasileiras e internacionais, com links para as fontes.</p></div></li><li><span>02</span><div><h3>Um percurso que é seu.</h3><p>Explore temas e organize referências em coleções.</p></div></li></ul>
   ${link(LIBRARY_URL,'Conhecer a Library')}<p class="eco-access">Ativação pelo Club em preparação. Texto completo e condições de acesso dependem de cada fonte.</p>
  </div>
  <figure class="eco-preview eco-library-preview"><div class="eco-preview-heading"><span>UM UNIVERSO DE REFERÊNCIAS</span><span>LIBRARY / ACERVO</span></div><a href="${LIBRARY_URL}" target="_blank" rel="noopener noreferrer" class="eco-image-link" aria-label="Conhecer o acervo da Library — abre em nova aba"><img src="/assets/ecosystem/library-acervo.webp" alt="Captura real da Library: acervo por tema, filtros de pesquisa e referências com suas fontes." width="1400" height="972" loading="lazy" decoding="async"></a><figcaption><span>Encontre seu próximo conhecimento.</span><span>Captura da interface</span></figcaption><div class="eco-library-index" aria-hidden="true"><span>Descobrir.</span><span>Relacionar.</span><span>Guardar.</span></div></figure>
 </div>
 <div class="eco-section-foot"><span>PARTE DO ECOSSISTEMA THE MED</span><span>Para estudar, explorar e continuar aprendendo.</span></div>
</section>`;}
export const renderEcosystemSections = () => renderAtlasSection() + renderLibrarySection();
