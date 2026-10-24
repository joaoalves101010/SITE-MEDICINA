import { renderWordmark } from './wordmark.js';
/* Internal templates, adapted from the source geometry of the reference.
 * The art, product narrative and identities here belong to THE MED; no source
 * clients, people or commercial claims are carried into these pages. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const path = value => {
  const src = typeof value === 'string' ? value : value?.src || value?.image || '';
  return src.startsWith('/') ? src : `/${src}`;
};
const paragraphs = value => (Array.isArray(value) ? value : String(value || '').split(/\n\s*\n/)).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
const arrow = (direction = 'right') => `<svg class="page-arrow ${direction}" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 20h29M22 8l12 12-12 12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
const photo = (src, alt, cls = '', eager = false) => `<img class="${cls}" src="${esc(path(src))}" alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
const imageBlock = (src, alt, variant = '', accent = '') => `<figure class="page-image ${variant} reveal"${accent ? ` style="--panel-color:${esc(accent)}"` : ''}><div class="poster"><div class="img-container" data-parallax="0.5">${photo(src, alt)}</div></div><figcaption>${esc(alt)}</figcaption></figure>`;

// The distinct CMS media rhythms are retained, not flattened into a generic gallery.
export const caseMediaPatterns = {
  trajetoria: ['C','F','P','F','P','C','C','C','F','CCCC','F','CCCC'],
  hoje: ['I','IP'], explorar: ['I','PFFF'], mentor: ['I','PF'],
  acervo: ['C','C','F'], ligas: ['C','FF','PPCCCCC'],
  pesquisa: ['I','F','I','PP','IPP','I'], club: ['FI','FCF']
};
const A = file => `/assets/${file}`;
const caseFrames = {
  trajetoria: [
    ['vision.webp'], ['vision-detail.webp'], ['cv.webp','cv-detail.webp'], ['cv-detail.webp'],
    ['instituicoes-detail.webp','trajetoria-comparar.png'], ['trajetoria-comparar.png'],
    ['residencia-detail.webp'], ['internacional-detail.webp'], ['path.webp'],
    ['cv-detail.webp','research-detail.webp','ligas-detail.webp','acompanhamento.png'],
    ['home-detail.webp'], ['vision-detail.webp','home-detail.webp','mentor-detail.webp','path-detail.webp']
  ],
  hoje: [['home.webp'],['home-detail.webp','home.webp','path-detail.webp']],
  explorar: [['explore.webp'],['explore-detail.webp','instituicoes-detail.webp','explore-detail.webp','instituicoes-detail.webp','internacional-detail.webp']],
  mentor: [['mentor.webp'],['mentor-detail.webp','acompanhamento.png','acompanhamento.png']],
  acervo: [['acervo.png'],['pesquisa-manual.png'],['mentor-detail.webp']],
  ligas: [['ligas-buscar.png'],['ligas-inicio.png','ligas-detail.webp'],['ligas-detail.webp','ligas-projeto.png','ligas-buscar.png','ligas-inicio.png','ligas-projeto.png','ligas-detail.webp','ligas-inicio.png','ligas-buscar.png','ligas-projeto.png']],
  pesquisa: [['pesquisa-painel.png'],['pesquisa-manual.png'],['pesquisa-ferramentas.png'],['research-detail.webp','pesquisa-ferramentas.png','pesquisa-manual.png','pesquisa-projetos.png'],['pesquisa-projetos.png','research-detail.webp','pesquisa-projetos.png','research.webp','pesquisa-painel.png'],['research.webp']],
  club: [['club-detail.webp','acervo.png'],['club-detail.webp','home-detail.webp','path-detail.webp']]
};
const demoNotice = 'Interfaces de demonstração da THE MED, preservadas com a identidade visual anterior do produto. Pessoas, instituições, números e atividades nas telas são exemplos, não resultados ou parcerias anunciadas.';
const notice = () => `<p class="interface-notice page-interface-notice">${demoNotice}</p>`;
function pairedMedia(first, second, alt, accent = '') {
  return `<div class="case-media-pair reveal" data-media-type="P"${accent ? ` style="--panel-color:${esc(accent)}"` : ''}>${[first,second].map((src,i) => `<figure class="paired-poster"><div class="img-container" data-parallax="${i ? '-0.5' : '0.5'}">${photo(src, `${alt} — perspectiva ${i+1}`)}</div></figure>`).join('')}</div>`;
}
function caseMedia(project, section, blockIndex) {
  const pattern = caseMediaPatterns[project.slug]?.[blockIndex] || 'I';
  const frames = (caseFrames[project.slug]?.[blockIndex] || [section.image || project.image]).map(src => src.startsWith('/') ? src : A(src));
  let frame = 0;
  return [...pattern].map(type => {
    const src = frames[frame++] || section.image || project.image;
    if(type === 'P') return pairedMedia(src,frames[frame++] || project.cover,section.title,project.accent);
    return imageBlock(src, `Interface de demonstração — ${section.title}`, type === 'F' ? 'full-width' : type === 'C' ? 'is-contain' : 'standard-image', project.accent).replace('<figure ', `<figure data-media-type="${type}" `);
  }).join('');
}
const rotatingSeal = (href, label, id, className='') => `<a class="scroll-seal ${className}" href="${href}" aria-label="${esc(label)}"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="${id}" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0"/></defs><text><textPath href="#${id}" textLength="225">CONTINUE EXPLORANDO · THE MED · </textPath></text></svg><span>↓</span></a>`;

/** Reusable case study: title, full-bleed cover, facts/challenge, varied blocks, next. */
export function renderProject(project, projects = []) {
  if (!project) return '<section class="container page-not-found"><h1>Este caminho ainda não existe.</h1><a href="/#works">Voltar aos módulos</a></section>';
  const index = projects.findIndex(p => p.slug === project.slug);
  const next = projects.find(p => p.slug === project.next) || projects[(index + 1) % projects.length];
  const sections = project.sections || [];
  const details = project.details || [];
  const cover = project.cover || project.image;
  return `<article id="case-study" class="container case-study" style="--project-accent:${esc(project.accent || '#742c40')}">
    <div class="btn-wrapper"><a class="btn-back" href="/" aria-label="Voltar ao início"><span class="background"></span><span class="content">${arrow('left')}</span></a></div>
    <h1 class="project--title">${esc(project.heroLine || project.title)}</h1>
    <figure class="project--thumbnail"><div class="poster"><div class="img-container" data-parallax="0.5">${photo(cover, `Interface do módulo ${project.title} da THE MED`, '', true)}</div></div><figcaption>Uma visão do módulo ${esc(project.title)}.</figcaption></figure>${notice()}
    <section class="project--details reveal" aria-label="Sobre o módulo">
      <div class="project-facts"><p class="case-brand"><span class="case-wordmark">${renderWordmark({label:'the med'})}</span></p><p class="case-category">${esc(project.category)}</p><dl>${details.map(item => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('')}</dl><p class="date">Experiência em pré-lançamento</p><a class="button--arrow" href="https://innectaos.vercel.app/" target="_blank" rel="noopener noreferrer">${arrow()}<span>Conhecer a plataforma</span><span class="sr-only"> — abre em nova aba</span></a></div>
      <div class="challenge"><span class="eyebrow">${esc(project.introTitle || 'O que este módulo organiza')}</span><div class="wysiwyg">${paragraphs(project.description || project.intro || project.summary)}</div></div>
    </section>
    <div class="text-imgs">${sections.map((section, i) => `<section class="case-section" data-case-block="${i+1}" data-media-sequence="${caseMediaPatterns[project.slug]?.[i] || 'I'}"><div class="text-two-columns reveal"><div><span class="type eyebrow">${esc(section.eyebrow || `${String(i + 1).padStart(2,'0')} / ${project.title}`)}</span><h2 class="title">${esc(section.title)}</h2></div><div class="section-copy">${paragraphs(section.body || section.text)}</div></div>${caseMedia(project,section,i)}</section>`).join('')}</div>
    <section class="project--credits" aria-labelledby="case-context-title"><h2 class="title" id="case-context-title">Dentro do módulo.</h2><div class="credits-grid reveal"><div><span class="column-txt">Módulo</span><p>${esc(project.title)}</p></div><div><span class="column-txt">Dentro da sua trajetória</span><p>${esc(project.summary)}</p></div></div>${project.bullets?.length ? `<div class="credits-grid reveal"><div><span class="column-txt">Pontos de partida</span></div><div><ul class="case-bullets">${project.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}<div class="credits-grid case-note reveal"><div><span class="column-txt">Uma experiência em construção</span></div><div><p>A THE MED está em pré-lançamento. Esta página apresenta a proposta do módulo e telas do produto; disponibilidade e condições de acesso são informadas na plataforma.</p></div></div></section>
    ${next ? `<a class="next-project reveal" href="/modulos/${esc(next.slug)}/" aria-label="Próximo módulo: ${esc(next.title)}"><div class="poster">${photo(next.cover || next.image, '')}<div class="mask"></div></div><div class="name"><span class="next-label">Próximo módulo</span><span class="next-name">${arrow()}${esc(next.title)}</span></div></a>` : '<a class="case-return" href="/#works">Explorar todos os módulos</a>'}
  </article>`;
}

/** Long-form editorial: the source's 16 visible entries and closing CTA. */
export function renderCommunity(editorial = {}, projects = []) {
  const sections = editorial.sections || [];
  const cover = editorial.cover || '/assets/ligas-projeto.png';
  const titleBlock = (index, entry) => { const section = sections[index] || {};return `<section class="title-paragraph reveal" data-editorial-entry="${entry}"><h2>${esc(section.title)}</h2><div>${paragraphs(section.body || section.text)}</div></section>`; };
  const pair = (first,second,entry) => `<section class="two-illustrations community-pair" data-editorial-entry="${entry}" aria-label="Perspectivas da experiência THE MED">${[first,second].map((src,i) => `<figure class="illustration reveal" data-parallax="${i ? '1' : '-1'}"><div class="img-container" data-parallax="${i ? '-0.75' : '0.75'}">${photo(A(src),'Interface de demonstração da THE MED')}</div></figure>`).join('')}</section>`;
  const media = (file,type,entry) => imageBlock(A(file),'Interface de demonstração da THE MED',type).replace('<figure ',`<figure data-editorial-entry="${entry}" `);
  return `<article id="community" class="community-page"><div class="container">
    <section class="hero-cover" aria-labelledby="community-title">
      <div class="community-cover-media"><video id="community-hero-film" controls autoplay muted loop playsinline preload="metadata" poster="${esc(path(cover))}" aria-label="Tour silencioso pelas interfaces de demonstração da THE MED"><source src="/assets/innecta-tour.mp4" type="video/mp4"></video><div class="community-cover-shade"></div></div>
      <h1 class="community-identity" id="community-title"><span class="community-wordmark">${renderWordmark({label:'the med'})}</span><span>coletiva</span></h1>
      ${rotatingSeal('/percursos/','Conhecer os percursos','community-seal-path','community-directory-seal')}
    </section>
    <div class="editorial-content" id="community-story"><div class="editorial-lights" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <section class="text-sentence reveal" data-editorial-entry="1"><p>UMA TRAJETÓRIA SE CONSTRÓI SOZINHA?</p><p>${esc(editorial.intro)}</p></section>
      <div class="wrapper-btn reveal"><a class="editorial-directory-link" href="/percursos/">Conhecer os percursos <span aria-hidden="true">↗</span></a></div>
      ${pair('ligas-projeto.png','pesquisa-painel.png',2)}
      ${titleBlock(0,3)}
      <section class="community-film reveal" id="community-film" data-editorial-entry="4" aria-label="Tour visual da THE MED"><video controls playsinline preload="none" poster="/assets/home.webp" aria-label="Apresentação das interfaces da THE MED"><source src="/assets/innecta-tour.mp4" type="video/mp4"><p>Seu navegador não reproduz este vídeo. <a href="/assets/innecta-tour.mp4">Abrir a apresentação</a>.</p></video><p class="film-caption">Um percurso visual pelas interfaces de demonstração. Sem áudio.</p></section>
      ${media('research-detail.webp','full-width',5)}
      ${titleBlock(1,6)}
      ${pair('pesquisa-ferramentas.png','ligas-projeto.png',7)}
      ${titleBlock(2,8)}
      ${media('pesquisa-projetos.png','standard-image',9)}
      ${titleBlock(3,10)}
      ${media('ligas-inicio.png','standard-image',11)}
      ${titleBlock(4,12)}
      ${pair('mentor-detail.webp','acompanhamento.png',13)}
      ${media('club-detail.webp','standard-image',14)}
      <section class="text-sentence closing-statement reveal" data-editorial-entry="15"><p>O CAMINHO É SEU.<br>AS CONEXÕES TAMBÉM FAZEM PARTE DELE.</p></section>
      <section class="editorial-ownership reveal" data-editorial-entry="16"><p>Uma perspectiva editorial da THE MED sobre formação, pesquisa e comunidade. Produto em pré-lançamento.</p>${notice()}</section>
      <div class="wrapper-btn community-ending reveal" data-editorial-entry="17"><a class="editorial-directory-link" href="/percursos/">Descobrir os percursos ${arrow()}</a></div>
    </div>
  </div></article>`;
}

/** The source directory has two cards; these are product perspectives, not people. */
export function renderDirectory(profiles = []) {
  return `<section id="artists" class="directory-page">
    <section class="hero directory-hero" data-render-mode="pending" aria-labelledby="directory-title"><div class="hero-fallback" aria-hidden="true"><span class="fallback-field"></span><span class="fallback-lens"></span></div><canvas class="hero-canvas" aria-hidden="true"></canvas><div class="hero-gradient" aria-hidden="true"></div><div class="hero-sentence"><h1 id="directory-title">Cada trajetória.<br>Um novo <i>olhar.</i></h1></div>${rotatingSeal('#directory-grid','Explorar os percursos','directory-seal-path','directory-seal')}</section>
    <div class="container"><section class="artists-card-list" id="directory-grid" aria-labelledby="directory-label"><p class="eyebrow" id="directory-label">Duas perspectivas. Muitos caminhos.</p>${notice()}<ul class="project-grid directory-grid">${profiles.slice(0,2).map((profile, i) => `<li class="project-card directory-card reveal"><button class="artist-card-item" type="button" data-profile="${esc(profile.id || profile.slug || i)}" aria-haspopup="dialog" aria-label="Conhecer ${esc(profile.title || profile.name)}"><span class="card-image"><span class="directory-card-number">${String(i+1).padStart(2,'0')}</span>${photo(profile.cover || profile.image, `${profile.title || profile.name}: uma perspectiva da THE MED`)}<span class="directory-card-open" aria-hidden="true">↗</span></span><span class="card-caption"><span class="title">${esc(profile.title || profile.name)}</span><span class="category">${esc(profile.category || profile.role)}</span></span></button></li>`).join('')}</ul></section><div class="directory-end"><a href="#artists" class="directory-backtop" aria-label="Voltar ao topo">${arrow('up')}</a><span>Voltar ao topo</span></div></div>
  </section>`;
}

/** Optional modal markup; app owns focus management, close/history, carousel & swipe. */
export function renderProfileModal(profile = {}) {
  const gallery = (profile.gallery?.length ? profile.gallery : [profile.image || profile.cover]).filter(Boolean);
  const id = profile.id || profile.slug || 'percurso';
  return `<div class="profile-modal" id="profile-modal" data-profile-id="${esc(id)}" tabindex="-1"><div class="profile-slider" aria-label="Imagens do percurso"><div class="profile-slides">${gallery[0] ? `<div class="profile-slide active">${photo(gallery[0], `${profile.title || profile.name}: interface 1`, '', true).replace('<img ', '<img data-carousel-image ')}</div>` : ''}</div>${gallery.length > 1 ? `<div class="profile-slide-controls"><span class="profile-slide-count" data-carousel-count aria-live="polite">1 / ${gallery.length}</span><button type="button" data-carousel-prev aria-label="Imagem anterior">${arrow('left')}</button><button type="button" data-carousel-next aria-label="Próxima imagem">${arrow()}</button></div>` : ''}</div><div class="profile-content-wrapper"><div class="profile-content" data-modal-scroll><div class="profile-head"><span>THE MED / PERCURSOS</span><span>${esc(profile.category || profile.role)}</span></div><div class="profile-main"><h2 id="profile-title">${esc(profile.title || profile.name)}</h2><p class="profile-summary">${esc(profile.summary)}</p><div class="profile-body">${profile.bodyBlocks?.length ? profile.bodyBlocks.map((block,i) => { if(block.type==='image')return `<figure class="profile-body-image" data-modal-block="${i+1}">${photo(block.src,block.alt || 'Interface de demonstração da THE MED')}</figure>`;if(block.type==='video')return `<div class="profile-body-video" data-modal-block="${i+1}"><video controls playsinline preload="none"${block.poster ? ` poster="${esc(path(block.poster))}"` : ''} aria-label="Tour silencioso pela interface THE MED"><source src="${esc(path(block.src))}" type="video/mp4"></video><p>Tour de interfaces de demonstração. Sem áudio.</p></div>`;return `<p class="${block.type==='quote' ? 'profile-pullquote' : block.type==='centered' ? 'centered' : ''}" data-modal-block="${i+1}">${esc(block.text)}</p>`;}).join('') : paragraphs(profile.body)}<p class="profile-note">${demoNotice} A experiência THE MED está em pré-lançamento.</p>${profile.href || profile.module ? `<a href="${esc(profile.href || `/modulos/${profile.module}/`)}" class="editorial-text-link">Explorar este módulo ${arrow()}</a>` : ''}</div><button class="profile-top" type="button" data-modal-top aria-label="Voltar ao início do percurso">${arrow('up')}</button></div></div></div><button class="profile-close" type="button" data-modal-close aria-label="Fechar percurso">${arrow('left')}</button></div>`;
}
