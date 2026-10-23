# Arquitetura e manutenção

## Publicação estática

HTML pré-renderizado e módulos JavaScript locais. O build importa `js/templates.js` e `js/pages.js`, escreve 11 páginas físicas e `404.html`, e copia `js`, `css` e `assets` para `dist`. Não há bundler, instalação npm, backend ou resolução dinâmica por CDN.

Rotas: `/`, `/comunidade/`, `/percursos/` e `/modulos/{trajetoria,hoje,explorar,mentor,acervo,ligas,pesquisa,club}/`.

## Divisão do código

| Área | Arquivos principais |
|---|---|
| Estrutura, navegação e integração | `templates.js`, `pages.js`, `app.js` |
| Conteúdo dos módulos e perfis | `content.js` |
| Hero e campo contínuo das duas primeiras dobras | `hero.js`, `hero-copy.js`, `shared-scene.js`, `shaders/` |
| Globo geográfico interativo e leituras | `science-globe.js`, `science-content.js` |
| Diagramas editoriais dos princípios | `principle-visuals.js` |
| Livro | `book-section.js`, `book-controller.js`, `book-drag.js`, `book-renderer.js`, `book-fallback.js`, `book-art.js`, `book-editorial.js` |
| Galeria médica | `medical-experiences.js`, `medical-experiences-controller.js`, `experience-engagement.js`, `viscose-engine.js`, `viscose-shaders.js` |
| Diagnóstico opt-in | `experience-diagnostic.js` |
| Vídeo nas páginas internas | `video.js` |

## Ciclo de vida e acesso

Inicialização gráfica preguiçosa, conteúdo sem bloqueio de tela, alternativas visuais em caso de falha, pausa fora de tela/aba oculta e limpeza dos recursos. A navegação preserva menu, histórico, links físicos, foco, Escape e preferência de movimento reduzido.

A animação do hero não controla o carregamento do restante da página. A galeria possui uma introdução própria, reiniciada em cada carregamento, com captura finita de rolagem enquanto está alinhada. O livro usa uma coordenada mestre de rolagem; seu arraste não cria um estado de página independente.

## Testar alterações

Rode `npm run build`, `npm run check` e `npm test` na cópia editada. Os testes de escopo contêm snapshots históricos e normalizações deliberadas: não atualize hashes indiscriminadamente para esconder regressões. A sanitização desta exportação atualizou apenas expectativas dos manifestos e avisos de proveniência sanitizados, sem mudar a aplicação.

Valide em navegador desktop e móvel: entrada/restauração, scroll nos dois sentidos, PageDown/Escape, menu, foco, rotas diretas, WebGL e fallback, movimento reduzido, context loss e retorno de histórico. Uma compilação de shader ou teste simulado não substitui validação gráfica no dispositivo final.

## Geografia regenerável

`node scripts/generate-globe.mjs` usa exclusivamente os arquivos em `tools/globe-source/` para recriar `assets/science-globe/geography.json` e `fallback.svg`. Isso é opcional para construir o site. D3 não é usado no runtime do globo. Preserve as licenças e verifique a proveniência do conjunto geográfico antes de redistribuição pública.
