# THE MED TIMES — dobra editorial da landing page

## Decisão editorial · 25/10/2026

A dobra `#the-med-times` entra **depois das capacidades (`#partners`) e antes das experiências internacionais (`#medical-experiences`)**. O percurso mantém hero e ciência contínuos, apresenta o OS e seus módulos e, então, abre uma pausa de leitura antes de explorar o mundo da medicina. Não substitui nenhuma seção existente.

**Headline:** “A medicina avança. Sua visão também.”

**Apoio:** “Pesquisa, prática clínica e inovação no mundo, em português e com as fontes à vista. Um jornal para ampliar seu repertório e entender o contexto por trás das descobertas.”

As seis editorias reproduzem a estrutura real do jornal: Pesquisa, Clínica, Saúde pública, Formação, Inovação e Instituições. A copy de marketing permanece inalterada. A área branca agora mostra uma capa completa, densa e datada da edição 004 (25/10/2026), com títulos e trechos reais, sem edição fictícia, quota diária, promessa às 08h, garantia clínica ou aprovação.

## Composição e limites

- Capa vertical branca completa (1000 × 1480), três chamadas superiores, masthead, data, regras finas, colunas densas e duas fotografias reais. Texto e CTA à direita permanecem exatos. Mobile segue a mesma ordem no DOM, em uma coluna, com a página inteira visível e sem recorte.
- Masthead horizontal oficial em `assets/the-med-times-masthead.svg`, copiado sem modificação da versão aprovada do jornal. SHA-256: `f6d9bec3d6aad270324e4af2cf0f5794b9aa8c02b3e72f4ffe2a86662e3a1b38`.
- Copy externa preserva Roobert e a paleta existente. Na capa, preto sobre branco e vinho `#541919` só em metadados. Liberation Serif/Sans 2.1.5 foram convertidas em contornos vetoriais determinísticos; não há fonte adicional carregada pelo navegador. As fontes de geração usam SIL Open Font License 1.1; o texto original é preservado em `scripts/times-frontpage/fonts/FONT-LICENSE.txt`. A licença distingue arquivos de fonte dos documentos produzidos com eles, conforme o [repositório oficial](https://github.com/liberationfonts/liberation-fonts/blob/main/LICENSE). Nenhuma fonte do site principal ou do jornal foi alterada.
- HTML/CSS estáticos; nenhuma nova animação de rolagem, pin, WebGL, cursor, fetch ou estado persistente. Não modifica hero, lente mobile, saudação de cada reload, globo, galeria, módulos, navegação, guia ou CTA do OS.
- A legenda externa diz **“Prévia da edição 004 · 25/10/2026”**. Trata-se de uma composição editorial estática, não screenshot, capa ao vivo ou atualização automática. Um link acessível abre o jornal para leitura completa.
- Créditos completos abrem por “Créditos da prévia”. Fonte gratuita CDC/PHIL e aviso de não endosso também aparecem em texto legível fora do SVG. As fotografias Harvard 2008 (SA/Drsamir) e Aedes 2022 (CDC/Amy E. Lockwood) são de domínio público e mantêm o enquadramento integral.
- Gerador reproduzível e fontes/editorial/arquivos originais: `scripts/times-frontpage/`. Asset servido: `assets/the-med-times-frontpage-004.svg`; nenhum raster duplicado é baixado pela página.

## Acesso público ativo: uma única configuração

Em `js/times-config.js`:

```js
export const PUBLIC_TIMES_URL = 'https://themedtimes.vercel.app/';
```

O proprietário forneceu o endereço público acima após publicar o jornal; a resposta HTTPS e o conteúdo da primeira página foram conferidos. A dobra agora oferece **“Ler o jornal”**, com aviso de nova aba e `noopener noreferrer`. A ativação alterou somente a configuração e o estado de acesso. A revisão posterior substituiu apenas a representação do papel; a copy externa, as seis editorias, a CTA, o hero e as animações permanecem iguais.

Se a configuração ficar vazia ou inválida, a dobra mostra **“Em breve”** e **“Leitura disponível em breve”** como texto não clicável, sem botão desabilitado, `#` ou captura de contato.

Para uma futura mudança de endereço autorizada:

1. Verificar que é realmente o jornal, acessível sem login, no destino autorizado pelo usuário.
2. Preencher somente `PUBLIC_TIMES_URL` com a URL HTTPS pública.
3. Rodar `npm run build`, `npm test`, `npm run check` e revisar a versão em navegador no ambiente de publicação autorizado.
4. Publicar a landing page pelo fluxo autorizado do projeto.

A configuração válida gera **“Ler o jornal”** com âncora real, `noopener noreferrer` e aviso de nova aba. A validação rejeita protocolos inseguros, credenciais, porta não padrão, IPs, localhost, hosts internos e hosts ChatGPT/Sites. Ela **não verifica a acessibilidade remota** nem certifica que um domínio seja público; essa confirmação é etapa humana/operacional anterior à configuração.

## Arquivos e preservação

- `js/times-editorial.js`: renderização e sanitização da URL.
- `js/times-config.js`: único ponto de configuração do destino.
- `js/times-frontpage.js`: imagem integral, data explícita, link de leitura e créditos externos.
- `tests/times-frontpage.mjs`: preservação exata do restante da dobra, proveniência, tipos vetorizados, data, créditos e regras sem recorte.
- `css/times-editorial.css`: estilos restritos à nova dobra.
- `js/templates.js`: import, inclusão home-only e CSS home-only.
- `tests/times-editorial.mjs`: estados da CTA, sanitização, copy, ordem, semântica, CSS responsivo e preservação.
- `tests/times-editorial-baseline.json`: hashes anteriores à inclusão, base `9ba4cf1528d1e40cdae1b3ba8dc0429d69e58255`.
- Normalização exata remove somente uma inclusão aprovada; alterações vizinhas e duplicações continuam detectáveis. As baselines históricas não são regravadas.

## Verificação

As provas PNG são rasterizações nativas do SVG, não screenshots. A capa inteira foi inspecionada em alta resolução e nas larguras de 279/340/497 px, correspondentes matematicamente à área disponível em viewports de 320/390/1440 px. Os testes de fonte e HTML não substituem uma inspeção real de viewport. Não houve validação em navegador real ou Safari físico nesta revisão; quando disponível, a inspeção visual deve usar o preview suportado do ambiente de publicação.

Validação técnica do export: **408 testes do projeto e 3 testes de equivalência portátil, 584 verificações de HTML/rotas/assets, build e sintaxe passaram**. A preservação continua cobrindo os 147 arquivos anteriores e as 12 páginas. A nova cobertura verifica conteúdo literal da edição, layout sem sobreposição, tipografia vetorial, créditos, data e preservação exata da copy/CTA. O SVG tem 936.380 bytes (gzip: 424.618 bytes), é lazy-loaded e foi regenerado de forma independente com resultado idêntico. Nenhum JavaScript adicional é carregado pelo navegador para a dobra.
