# THE MED TIMES — dobra editorial da landing page

## Decisão editorial · 25/10/2026

A dobra `#the-med-times` entra **depois das capacidades (`#partners`) e antes das experiências internacionais (`#medical-experiences`)**. O percurso mantém hero e ciência contínuos, apresenta o OS e seus módulos e, então, abre uma pausa de leitura antes de explorar o mundo da medicina. Não substitui nenhuma seção existente.

**Headline:** “A medicina avança. Sua visão também.”

**Apoio:** “Pesquisa, prática clínica e inovação no mundo, em português e com as fontes à vista. Um jornal para ampliar seu repertório e entender o contexto por trás das descobertas.”

As seis editorias reproduzem a estrutura real do jornal: Pesquisa, Clínica, Saúde pública, Formação, Inovação e Instituições. O lema “Ciência para ler. Medicina para pensar.” e a assinatura “Uma leitura crítica do mundo da saúde.” vêm da identidade editorial existente. Não há manchetes datadas, edição fictícia, quota diária, disponibilidade às 08h, garantia clínica ou promessa de aprovação.

## Composição e limites

- Folha clara e plana à esquerda; texto e acesso à direita. Mobile segue a mesma ordem no DOM, em uma coluna.
- Masthead horizontal oficial em `assets/the-med-times-masthead.svg`, copiado sem modificação da versão aprovada do jornal. SHA-256: `f6d9bec3d6aad270324e4af2cf0f5794b9aa8c02b3e72f4ffe2a86662e3a1b38`.
- Vinho `#541919`, creme e tipografias já existentes: Roobert e Innecta Serif. Sem nova fonte, screenshot, biblioteca, feed ou imagem gerada.
- HTML/CSS estáticos; nenhuma nova animação de rolagem, pin, WebGL, cursor, fetch ou estado persistente. Não modifica hero, lente mobile, saudação de cada reload, globo, galeria, módulos, navegação, guia ou CTA do OS.
- O desenho é uma **apresentação editorial atemporal**, não uma miniatura da edição vigente.

## Acesso público ativo: uma única configuração

Em `js/times-config.js`:

```js
export const PUBLIC_TIMES_URL = 'https://themedtimes.vercel.app/';
```

O proprietário forneceu o endereço público acima após publicar o jornal; a resposta HTTPS e o conteúdo da primeira página foram conferidos. A dobra agora oferece **“Ler o jornal”**, com aviso de nova aba e `noopener noreferrer`. Esta ativação altera somente a configuração e o estado de acesso; layout, copy editorial, estilos, hero e animações permanecem iguais.

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
- `css/times-editorial.css`: estilos restritos à nova dobra.
- `js/templates.js`: import, inclusão home-only e CSS home-only.
- `tests/times-editorial.mjs`: estados da CTA, sanitização, copy, ordem, semântica, CSS responsivo e preservação.
- `tests/times-editorial-baseline.json`: hashes anteriores à inclusão, base `9ba4cf1528d1e40cdae1b3ba8dc0429d69e58255`.
- Normalização exata remove somente uma inclusão aprovada; alterações vizinhas e duplicações continuam detectáveis. As baselines históricas não são regravadas.

## Verificação

Os testes automatizados de fonte/HTML não substituem uma inspeção real de viewport. O preview Sites suportado está indisponível neste ambiente (`sites-preview` ausente); a revisão visual deve usar **esse caminho suportado** quando disponível. Nenhuma evidência de Safari físico ou teste visual real é reivindicada por este documento.

Validação técnica da entrega: **400 testes Node (9 novos), 581 verificações de rotas/HTML/assets, build e sintaxe passaram**. A preservação verifica 147 arquivos anteriores e as 12 páginas geradas. CSS novo: 5.136 bytes; logo oficial: 294.829 bytes (aproximadamente 127 KB com gzip). Nenhum JavaScript adicional é carregado pelo navegador para a dobra.
