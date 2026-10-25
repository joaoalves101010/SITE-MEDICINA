# the med | Your Medical Journey

Landing page editorial da **the med | Your Medical Journey** para a formação acadêmica e a trajetória de estudantes de medicina. Projeto estático completo, em português, com animações progressivas, páginas de módulos, comunidade e percursos.

**Comece por [CONTEXTO_PROJETO.md](CONTEXTO_PROJETO.md)** para entender o objetivo, as decisões aprovadas, a ordem atual das seções, os comportamentos e os cuidados de continuidade.

## Identidade atual — 24/10/2026

A apresentação evoluiu de Innecta para Interny (23/10/2026) e, depois, para **the med | Your Medical Journey**. A identidade atual usa o **wordmark 02 aprovado, em minúsculas e curvas vetoriais próprias**, não um logotipo digitado em Roobert nem uma fonte identificada por aproximação.

- Roobert permanece nos textos. A paleta vinho/creme/rosa, a arte médica e as animações aprovadas foram preservadas. O vinho escuro da identidade é **`#501F30`**.
- O símbolo **09** complementa o wordmark; há variantes em preto, branco, vinho `#84384F` e vinho escuro `#501F30` em `brand/symbol-09/`. Na página, o símbolo preto fecha o rodapé alinhado à margem esquerda dos textos. O favicon usa o 09 branco sobre vinho escuro, com o desenho reduzido em **10%** em relação à primeira aplicação.
- A introdução mantém sua animação e os dois fragmentos: **“Olá.” / “Bem-vindo à”**, seguidos pelo wordmark SVG oficial. A capa e os rótulos autorais do livro também usam o desenho aprovado, sem mudar a mecânica.
- As **oito rotas de módulos** agora têm quatro seções editoriais cada, gráficos SVG/DOM e seleções locais, **sem screenshots, vídeos ou miniaturas de próximo projeto**. A home, o mosaico, a comunidade e os percursos mantêm seus conteúdos próprios.
- **OS** não faz parte do nome principal e não é mais o favicon; permanece apenas nos motivos contextuais e no índice do livro onde já existia.
- Screenshots originais e vídeo de demonstração ainda podem mostrar **Innecta** nos pixels. Os destinos [innectaos.vercel.app](https://innectaos.vercel.app/) e [innecta.vercel.app](https://innecta.vercel.app/) continuam inalterados. O projeto Enter permanece independente e com o nome Innecta; não houve renomeação de backend.
- Créditos históricos, origem dos materiais e licenças não foram reescritos. A aprovação visual da marca não equivale a pesquisa de disponibilidade ou registro.

## Apresentação do produto

A dobra `#product-os`, após a ciência e antes das capacidades, apresenta **the med OS** com o wordmark oficial, etapas conectadas e CTA para o produto externo. É uma composição responsiva HTML/CSS, sem capturar scroll ou adicionar GPU. O aviso de pré-lançamento e os limites de backend permanecem.

## Apresentação do jornal — 25/10/2026

A dobra `#the-med-times`, depois das capacidades e antes das experiências internacionais, apresenta **THE MED TIMES** com uma capa completa e densa da edição 004, de 25/10/2026: masthead oficial, manchetes e trechos reais, colunas e duas fotografias de contexto sem recorte. A legenda identifica a prévia congelada; a capa abre o jornal para leitura completa, e fontes/créditos permanecem acessíveis. Copy, seis editorias e CTA à direita continuam iguais. A composição responsiva usa fluxo normal, sem runtime de navegador adicional, WebGL ou captura de scroll.

O jornal está disponível em [themedtimes.vercel.app](https://themedtimes.vercel.app/), endereço público fornecido pelo proprietário e conferido por HTTPS. `PUBLIC_TIMES_URL` em `js/times-config.js` agora aponta para esse destino; a dobra apresenta **“Ler o jornal”** com abertura em nova aba e `noopener noreferrer`. Caso a configuração seja removida ou inválida, o componente volta ao estado não clicável “Em breve”. Veja [THE-MED-TIMES-FOLD.md](THE-MED-TIMES-FOLD.md). Nenhuma sincronização diária do jornal com GitHub/Vercel é configurada por esta apresentação.

## Executar

Requisitos: **Node.js 22 ou superior**, npm e Python 3 para o servidor local. Não há dependências npm para instalar: as bibliotecas de execução estão incluídas localmente.

```sh
npm run build   # gera/recria dist/
npm run check   # valida sintaxe JavaScript
npm test        # testes de conteúdo, rotas, recursos, animação e ciclo de vida
npm run serve   # abre servidor em http://localhost:4173
```

Abra o endereço do servidor, não os arquivos por `file://`. O `dist/` já acompanha esta exportação, mas deve ser reconstruído depois de editar o código. O script de build **substitui integralmente** esse diretório.

## Publicar

- Diretório público: **`dist`**.
- Comando de build: **`npm run build`**.
- Hospede os arquivos na **raiz do domínio**, com caminhos como `/assets/...` e `/modulos/trajetoria/`.
- Cada rota possui `index.html` físico; não é necessário roteador SPA ou rewrite geral. Use `404.html` como página de erro.
- Este pacote não configura nem afirma ativar GitHub Pages, domínio, autenticação ou qualquer serviço de hospedagem.
- **Atenção ao GitHub Pages de repositório:** publicar diretamente em `/SITE-MEDICINA/` não é equivalente a uma publicação na raiz. Os caminhos absolutos precisarão de uma adaptação de base antes desse modo de uso; alternativamente, use domínio próprio/host com raiz apropriada. Não basta copiar `dist` para uma subpasta e presumir compatibilidade.

## Estrutura

- `js/`: componentes, conteúdo, controladores, renderizadores e testes de unidade.
- `css/`: estilos e responsividade.
- `assets/`: imagens, ilustrações originais, fontes, vídeo e créditos.
- `brand/`: cópia do wordmark oficial e quatro variantes SVG do símbolo 09.
- `tests/`: regressões, conteúdo e integridade de escopo.
- `scripts/` e `tools/globe-source/`: regeneração opcional da geografia do globo.
- `build.mjs`: geração das 11 rotas físicas e do `404.html`.
- `dist/`: resultado publicável.
- `EXPORT_MANIFEST.json`: inventário com tamanho e SHA-256 dos arquivos exportados.

## Limites importantes

É uma **LP estática independente**, não o sistema autenticado originalmente apresentado como Innecta. Não inclui backend, banco, login, cobrança, checkout ou integração Asaas. O projeto Enter permanece separado, com sua identidade original Innecta. O rebranding desta LP não renomeia nem modifica o backend ou esses outros projetos. Os links externos do produto e das instituições são navegação, não integrações ou parcerias.

WebGL é aprimoramento visual, não requisito para ler o conteúdo. Há alternativas DOM/CSS, modo de movimento reduzido e saídas acessíveis da galeria. `?galleryDiagnostic=1` abre um painel local opcional de diagnóstico; não envia telemetria. A aparência real de todos os efeitos na GPU de um dispositivo precisa de validação nesse dispositivo.

## Fontes e direitos

Leia **[FONTES_E_LICENCAS.md](FONTES_E_LICENCAS.md)** antes de redistribuir/publicar comercialmente. Os créditos individuais das fotografias devem ser mantidos. A presença dos arquivos **Roobert** e dos efeitos derivados de referências não estabelece autorização geral de redistribuição. Este pacote não aplica uma licença única que substitua direitos de terceiros.

Documentação complementar: [REBRAND-THE-MED.md](REBRAND-THE-MED.md), [MODULES-EDITORIAL.md](MODULES-EDITORIAL.md), [IMPLEMENTATION.md](IMPLEMENTATION.md), [BOOK-IMPLEMENTATION.md](BOOK-IMPLEMENTATION.md), [SCIENCE-SOURCES.md](SCIENCE-SOURCES.md) e [MEDICAL-EXPERIENCES-SOURCES.md](MEDICAL-EXPERIENCES-SOURCES.md).

## Ajuste mobile e guia — 24/10/2026

O livro foi retirado da home em desktop e mobile; `#team` agora apresenta o guia leve **Qual é o seu próximo passo?**, com três intenções e links reais. Seus arquivos históricos permanecem no repositório, mas não são carregados pela página.

Na entrada principal por toque, a galeria usa fotos grandes e scroll horizontal nativo, sem WebGL ou intro longa. O fundo compartilhado usa sticky nativo com altura estável, e gestos cancelam deslocamentos automáticos de hash pendentes. A versão desktop mantém sua galeria líquida. Veja `JOURNEY-GUIDE.md` e `MOBILE-SAFARI.md` para evidências, decisões e limites: a versão corrigida ainda requer confirmação visual em iPhone físico.
