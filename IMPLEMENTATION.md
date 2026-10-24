# Arquitetura e manutenção — the med

Identidade atual: **the med | Your Medical Journey** (24/10/2026). O wordmark 02 é um desenho vetorial compartilhado, não texto em Roobert. A revisão dos módulos não altera os motores gráficos da home.

## Publicação estática

HTML pré-renderizado e módulos JavaScript locais. O build importa `js/templates.js` e `js/pages.js`, escreve 11 páginas físicas e `404.html`, e copia `js`, `css` e `assets` para `dist`. Não há bundler, instalação npm, backend ou resolução dinâmica por CDN.

Rotas: `/`, `/comunidade/`, `/percursos/` e `/modulos/{trajetoria,hoje,explorar,mentor,acervo,ligas,pesquisa,club}/`.

## Divisão do código

| Área | Arquivos principais |
|---|---|
| Estrutura, navegação e integração | `templates.js`, `pages.js`, `app.js` |
| Metadados globais, princípios, comunidade e percursos | `content.js` |
| Wordmark vetorial e aplicações | `wordmark.js`, `footer-wordmark.js`, `css/wordmark.css`, `assets/the-med-wordmark.svg` |
| Trajetória editorial | `trajectory-page.js`, `trajectory.js`, `css/trajectory.css` |
| Sete módulos irmãos | `module-experiences.js`, `module-experiences-controller.js`, `css/module-experiences.css` |
| Hero e campo contínuo das duas primeiras dobras | `hero.js`, `hero-copy.js`, `shared-scene.js`, `shaders/` |
| Globo geográfico interativo e leituras | `science-globe.js`, `science-content.js` |
| Diagramas editoriais dos princípios | `principle-visuals.js` |
| Livro | `book-section.js`, `book-controller.js`, `book-drag.js`, `book-renderer.js`, `book-fallback.js`, `book-art.js`, `book-editorial.js` |
| Galeria médica | `medical-experiences.js`, `medical-experiences-controller.js`, `experience-engagement.js`, `viscose-engine.js`, `viscose-shaders.js` |
| Diagnóstico opt-in | `experience-diagnostic.js` |
| Vídeo na mídia interna remanescente, fora dos módulos | `video.js` |

## Módulos e identidade

As oito rotas `/modulos/` usam renderizadores dedicados, **quatro seções por página**, cabeçalho/navegação locais e gráficos SVG/DOM; não carregam screenshots, vídeos, canvas ou miniaturas de próximo projeto. `templates.js` seleciona a página e carrega seu CSS/controlador apenas na rota pertinente, antes de `app.js`. As seleções são ilustrativas, sem rede, armazenamento ou conta. Conteúdo essencial permanece sem JavaScript; teclado e movimento reduzido não dependem de WebGL. Não há scroll pin local. Ver `MODULES-EDITORIAL.md`.

O símbolo 09 preto fecha o rodapé alinhado à esquerda. `assets/favicon.svg` aplica o 09 branco sobre `#501F30`, com 10% de redução do desenho. A introdução “Olá.” / “Bem-vindo à” mantém sua animação e usa o wordmark SVG. Textos continuam em Roobert; geometria e gestos do livro, hero, globo e galeria permanecem separados da identidade.

## Ciclo de vida e acesso

Inicialização gráfica preguiçosa, conteúdo sem bloqueio de tela, alternativas visuais em caso de falha, pausa fora de tela/aba oculta e limpeza dos recursos. A navegação preserva menu, histórico, links físicos, foco, Escape e preferência de movimento reduzido.

A animação do hero não controla o carregamento do restante da página. A galeria possui uma introdução própria, reiniciada em cada carregamento, com captura finita de rolagem enquanto está alinhada. O livro usa uma coordenada mestre de rolagem; seu arraste não cria um estado de página independente.

## Testar alterações

Rode `npm run build`, `npm run check` e `npm test` na cópia editada. Os testes de escopo contêm snapshots históricos e normalizações deliberadas: não atualize hashes indiscriminadamente para esconder regressões. A sanitização desta exportação atualizou apenas expectativas dos manifestos e avisos de proveniência sanitizados, sem mudar a aplicação.

Valide em navegador desktop e móvel: entrada/restauração, scroll nos dois sentidos, PageDown/Escape, menu, foco, rotas diretas, WebGL e fallback, movimento reduzido, context loss e retorno de histórico. Uma compilação de shader ou teste simulado não substitui validação gráfica no dispositivo final. A recuperação efetiva da GPU no Mac avaliado continua sem confirmação direta; o navegador de nuvem registrou falha de criação de contexto WebGL.

## Geografia regenerável

`node scripts/generate-globe.mjs` usa exclusivamente os arquivos em `tools/globe-source/` para recriar `assets/science-globe/geography.json` e `fallback.svg`. Isso é opcional para construir o site. D3 não é usado no runtime do globo. Preserve as licenças e verifique a proveniência do conjunto geográfico antes de redistribuição pública.
