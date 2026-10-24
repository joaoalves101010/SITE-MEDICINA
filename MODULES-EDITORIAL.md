# Módulos editoriais — the med

## Revisão de 24/10/2026

As oito rotas `/modulos/` substituem os antigos estudos de caso com interfaces por uma apresentação editorial em **quatro seções por módulo**, sem screenshots, vídeos, iframe, canvas ou miniaturas de próximo projeto. Cada página tem cabeçalho, navegação de módulos e fechamento locais; não depende do palco gráfico da home.

| Rota | Percurso editorial e interação local |
| --- | --- |
| `/modulos/trajetoria/` | Formação médica, currículo e evidências, comparação de possibilidades e próximo passo. Seletores de perspectivas e checklist; preserva Visão, Currículo Studio, Instituições, Comparar, Residência, Internacional e Meu Caminho. |
| `/modulos/hoje/` | Prioridades e próximos passos; escolha de foco entre estudo, trajetória e pesquisa. |
| `/modulos/explorar/` | Descoberta por tipos: oportunidades, editais, instituições e congressos. Conferir fontes, requisitos e prazos continua essencial. |
| `/modulos/mentor/` | Duas formas distintas de apoio: **Mentor IA**, inteligência artificial, e **Ultra**, acompanhamento humano por mensagens, revisões e uma sessão mensal de **45 minutos**. |
| `/modulos/acervo/` | Leitura e retomada de referências; perspectivas de compreender, aplicar e retomar. |
| `/modulos/ligas/` | Colaboração acadêmica; contribuições de perguntar, organizar e registrar. |
| `/modulos/pesquisa/` | **Quinze etapas** conectadas pelos movimentos **Entender, Aplicar, Validar e Entregar**, sem inventar rótulos adicionais ou substituir as quinze por quatro. Leitura crítica e responsabilidade humana permanecem; validação não significa aprovação científica ou ética automática. |
| `/modulos/club/` | Interesses e conexão: aprender, conectar e construir, sem simular pessoas reais ou indicadores de adesão. |

Os gráficos são SVG/DOM autorais, com paleta vinho **`#501F30`**, creme e rosa, tipografia Roobert e o wordmark vetorial 02 aprovado. As seleções demonstram conceitos e possibilidades: **não criam conta, salvam plano, consultam dados pessoais nem executam serviços do produto**. Há uma nota local de experiência ilustrativa. A apresentação permanece em pré-lançamento; o CTA verificado segue para `https://innectaos.vercel.app/`. SaaS, checkout, Asaas e o projeto Enter não foram alterados.

## Arquitetura e acesso

- `js/trajectory-page.js` / `css/trajectory.css`: apresentação e dados de Trajetória.
- `js/trajectory.js`: seleção local, tabs acessíveis e checklist.
- `js/module-experiences.js` / `css/module-experiences.css`: renderização, conteúdo e gráficos dos sete módulos irmãos.
- `js/module-experiences-controller.js`: controles locais dos sete módulos; sem armazenamento, rede ou dependência gráfica.
- `js/templates.js`: despacho por rota e carregamento condicional de CSS/controlador, antes de `app.js`.

Nenhum framework ou serviço foi adicionado. Os controladores não exigem WebGL e não prendem a rolagem. Conteúdo essencial permanece legível sem JavaScript e o CSS respeita movimento reduzido. As seleções dos sete módulos usam radios nativos; teclas intencionais ficam isoladas do scroll global, enquanto atalhos com Alt/Ctrl/Meta permanecem disponíveis. Painéis sobrepostos mantêm a altura do maior conteúdo para evitar saltos. Eventos são limpos e a restauração via histórico é considerada; Trajetória mantém sua implementação própria de tabs e checklist.

## Ajustes de identidade associados

O símbolo 09 preto no fechamento do rodapé alinha com a margem esquerda dos textos. A introdução da home usa **“Olá. Bem-vindo à”** com o wordmark SVG, preservando seus dois fragmentos e a animação existente. O restante da home, a comunidade, os percursos, o livro, o globo e a galeria internacional mantêm suas experiências; o mosaico diagonal conserva suas interfaces originais.

## Verificação

```sh
npm run build
npm run check
npm test
```

Os testes cobrem quatro seções por rota, ausência de mídia nos módulos, destinos, teclado, seleção local, limpeza de eventos e preservação de outras seções. Testes automatizados não equivalem à inspeção visual em desktop e mobile; verificar também foco, zoom, ausência de JavaScript e retorno pelo histórico.

Referências de padrões, sem instalação dessas bibliotecas:
- [Tabs — Radix](https://www.radix-ui.com/primitives/docs/components/tabs)
- [Scroll — Motion](https://motion.dev/docs/scroll)
