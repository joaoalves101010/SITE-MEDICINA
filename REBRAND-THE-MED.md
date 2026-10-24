# the med | Your Medical Journey

**Identidade atual — 24/10/2026.** Este documento descreve a versão aprovada da landing page. A etapa Interny de 23/10/2026 permanece registrada em `REBRAND-INTERNY.md` como histórico, não como especificação atual.

## Wordmark 02

A assinatura visual é **the med**, em minúsculas, com desenho arredondado e geométrico. Os contornos foram reconstruídos em curvas vetoriais a partir da opção 02 escolhida; não se atribui um nome de fonte não verificado.

- `assets/the-med-wordmark.svg`: desenho transparente e escalável, sem imagem incorporada ou dependência de fonte.
- `js/wordmark.js`: os mesmos contornos usados pelo SVG das páginas e pelo Canvas2D do livro.
- `brand/the-med-wordmark.svg`: cópia do asset oficial para uso como arquivo de marca.
- `css/wordmark.css`: aplicações locais, sem esticar a proporção do desenho.
- Cabeçalhos, identificação dos módulos, assinatura da comunidade, capa e rótulos autorais do livro usam o wordmark. A tipografia dos demais textos continua em **Roobert**; o logo não é texto em Roobert.

A assinatura **Your Medical Journey** permanece. A escrita editorial **THE MED** em alguns títulos, metadados e rótulos acessíveis identifica o mesmo nome; não substitui a forma visual em minúsculas.

## Símbolo 09 e aplicações

O símbolo complementar aprovado é o **09**. O kit `brand/symbol-09/` contém quatro SVGs transparentes:

| Arquivo | Cor |
| --- | --- |
| `the-med-symbol-09-branco.svg` | Branco `#FFFFFF` |
| `the-med-symbol-09-preto.svg` | Preto `#000000` |
| `the-med-symbol-09-vinho.svg` | Vinho `#84384F` |
| `the-med-symbol-09-vinho-escuro.svg` | Vinho escuro `#501F30` |

Esses arquivos de marca não são quatro novos elementos da página. O fechamento do rodapé usa `assets/the-med-symbol-09-preto.svg`, alinhado com a margem esquerda dos textos. O favicon usa o **09 branco sobre vinho escuro `#501F30`**, com o desenho reduzido em **10%** em relação à primeira aplicação, preservando o fundo e a proporção. O símbolo 09 é distinto do wordmark 02.

A introdução animada da home mantém seus dois fragmentos, agora **“Olá.” / “Bem-vindo à”**, seguidos pelo wordmark SVG oficial. **OS** não integra o nome principal nem o favicon atual; permanece apenas nos motivos contextuais e no índice do livro onde já existia.

## Preservações e revisão editorial

Paleta vinho/creme/rosa, fontes dos textos, ilustrações médicas, hero, shaders, campo contínuo, lente, globo, galeria internacional, mosaico e mecanismos do livro foram preservados. As sete composições do livro usam a marca vetorial, sem mudança da geometria, camadas, rolagem ou arraste.

A revisão das oito páginas de módulos é descrita separadamente em `MODULES-EDITORIAL.md`: quatro seções por rota, gráficos e seleções locais, sem screenshots, vídeo ou miniatura de próximo projeto. Não se trata de uma migração do produto.

Screenshots e vídeos originais podem mostrar **Innecta** nos pixels e mantêm seu contexto de demonstração. Os destinos `https://innectaos.vercel.app/` e `https://innecta.vercel.app/` não foram alterados. Nomes técnicos compatíveis, como a meta tag `interny-build`, e registros históricos de proveniência permanecem.

## Limites

A mudança abrange somente esta landing page. O produto externo, o projeto Enter ainda identificado como Innecta, domínios, backend, autenticação, pagamentos e Asaas não foram renomeados nem modificados por ela. A documentação não afirma ativação de GitHub Pages ou nova hospedagem.

A aprovação visual não equivale a pesquisa de disponibilidade ou registro de marca. Créditos e licenças de fontes, fotografias, dados e referências continuam válidos conforme seus próprios termos; ver `FONTES_E_LICENCAS.md`.
