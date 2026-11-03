# THE MED · 404 personalizada

## Resultado

Página exclusiva para erros 404, integrada ao gerador estático existente. Mantém o wordmark vetorial oficial, Roobert, vinho/rosa/areia/marfim e linguagem editorial da THE MED.

- Composição 404 com a Terra em 3D: mapa de superfície NASA em 4K, nuvens independentes em 2K, luzes noturnas, iluminação dia/noite, brilho oceânico e atmosfera azul. Órbitas metálicas preservam a identidade rosa/vinho.
- Movimento ambiente, entrada de conteúdo, parallax por ponteiro e três perspectivas acionadas por botão.
- Navegação HTML para início, ecossistema, pesquisa, comunidade e percursos.
- Imagem real NASA do hemisfério ocidental como fallback imediato, inclusive sem JavaScript e sem WebGL.
- Pausa de animações, preferência por movimento reduzido, suspensão em aba oculta/fora da tela e descarte dos recursos gráficos.
- Nenhuma dependência npm, chamada a CDN, autenticação ou serviço novo. Uma cópia local oficial do Three.js 0.131.3 com TextureLoader é exclusiva desta página; o vendor das demais cenas não foi alterado.

## Arquivos principais

- `js/not-found-page.js`: documento HTML acessível e metadados noindex.
- `css/not-found.css`: apresentação isolada e responsiva.
- `js/not-found.js`: cena Three.js, qualidade adaptativa e ciclo de vida.
- `js/not-found-earth.js`: mapas reais, shader e carregamento com timeout/abort e descarte seguro.
- `assets/earth/`: quatro imagens otimizadas e créditos completos NASA em SOURCES.md.
- `js/vendor/three-earth.js`: distribuição oficial ES module, MIT, versão fixa.
- `js/templates.js`: somente importação e seleção da nova página 404.
- `tests/not-found.mjs`: oito testes de semântica, desempenho e ciclo de vida.
- `tests/not-found-scope.test.mjs`: dois testes do normalizador estrito de escopo.
- `tests/not-found-earth.mjs`: cinco testes de assets, carregamento, falhas, timeout, abort e chegadas tardias.

Os testes históricos preservam seus hashes antigos usando um normalizador que aceita apenas a nova página aprovada inteira. Mutações inesperadas continuam detectáveis. As outras onze rotas foram comparadas byte a byte com build fixo e permanecem iguais.

## Executar

Node.js 22 ou superior. Não é necessário `npm install`.

1. `npm run build`
2. `npm run check`
3. `npm test`
4. `npm run serve`
5. Abra `http://localhost:4173/404.html`.

O servidor Python de desenvolvimento não aplica o documento de erro personalizado automaticamente a endereços desconhecidos. A publicação Vercel usa `dist/404.html` como página 404, conforme a convenção de projetos estáticos: https://vercel.com/kb/guide/custom-404-page . Não adicione rewrite geral para index.html.

## Verificação em 03/11/2026

- Build e checagem de sintaxe: aprovados.
- `npm test`: 480 testes aprovados, incluindo quinze testes da página 404.
- Validação estrutural do build: 580 verificações aprovadas.
- Exportação portátil: três testes adicionais aprovados.
- Desktop e mobile: composição e fallback inspecionados em navegador. Sem overflow horizontal em desktop e frames móveis de 390/320 px; a revisão da Terra conferiu larguras úteis de 390 e 320 px, inclusive com JavaScript bloqueado.
- Navegação para início e retorno pelo histórico: aprovados.
- Skip link por teclado e controle de pausa: aprovados.
- Reduced motion, aba oculta, bfcache, perda de contexto e descarte: testes automatizados aprovados.

### Limites honestos de QA

O navegador disponível não cria um contexto WebGL. A cena real de GPU foi implementada e seu ciclo de vida foi testado com runtime simulado; a inspeção visual realizada é do fallback com imagem NASA real. Ainda falta verificar a aparência e o frame rate da cena WebGL em um dispositivo com GPU, incluindo Safari/iPhone físico. Nenhum número de FPS é afirmado.

O site público mantém a versão anterior. Uma URL inexistente de produção respondeu HTTP 404 com o documento antigo, confirmando a convenção atual. A nova página ainda não foi publicada e seu status HTTP no deploy novo deverá ser verificado após publicação autorizada.

## Publicação e rollback

Base de integração: `joaoalves101010/SITE-MEDICINA`, commit `1fdebc0534cf0bd7aadaddaecf35040efda63eed`.

Depois da revisão e autorização de publicação, aplicar a alteração ao repositório correto, executar os testes, publicar `dist/` e abrir uma URL inexistente para verificar corpo e status HTTP 404. Não foi feito push, PR ou deploy do site principal nesta entrega. A prévia independente é separada do site principal.

Para rollback, reverter os arquivos desta alteração e reconstruir `dist/`. Não há migração de dados, configurações de conta ou permissões novas.

## Bibliotecas avaliadas

Foram considerados Three.js, React Three Fiber/Drei, GSAP/Motion e abordagens de componentes animados. A stack existente é HTML estático com módulos JavaScript; manter Three.js local e CSS evita introduzir React apenas para a página de erro. O shader próprio combina mapas reais NASA e iluminação decorativa. Não é uma simulação científica: as nuvens e luzes provêm de composições históricas, sem representar condições em tempo real. As fontes e condições de reutilização estão em assets/earth/SOURCES.md.

Referências: https://threejs.org/docs/ ; https://drei.docs.pmnd.rs/shaders/mesh-transmission-material ; https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ . Os créditos e licenças existentes permanecem aplicáveis.

## Prévia autônoma

`PREVIA-THE-MED-404.html` incorpora runtime, fontes e imagens (aproximadamente 3,68 MB) para funcionar sem arquivos auxiliares. Os links de navegação apontam para o site principal. O pacote inclui um patch binário aplicável à base informada.
