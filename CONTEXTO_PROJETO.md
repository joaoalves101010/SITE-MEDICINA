# the med | Your Medical Journey — contexto do projeto Monopo LP

> **Documento de continuidade — atualizado em 24 de outubro de 2026.** Descreve a versão atual da landing page, suas decisões aprovadas, a organização técnica e os limites conhecidos. É um ponto de partida para manter o projeto sem reconstruir decisões antigas ou confundir a apresentação com o produto completo.

## 1. O que é este projeto

Esta é uma experiência de apresentação da **the med | Your Medical Journey**, voltada à trajetória acadêmica e à formação médica. A proposta conecta organização da rotina, currículo, residência, oportunidades, pesquisa, ligas, conhecimento e orientação.

A proposta apresentada como the med está **em pré-lançamento**. Este repositório contém uma **landing page estática com páginas editoriais internas e interações visuais**, não o backend da plataforma. Não implementa autenticação, banco de dados, inscrições em programas externos, checkout ou cobrança. A integração com **Asaas permanece expressamente adiada**.

O projeto nasceu de uma adaptação estrutural e visual do site Monopo e evoluiu por revisões específicas aprovadas: ciência com globo interativo, princípios editoriais, mosaico de interfaces, livro médico ilustrado e galeria de experiências internacionais. Não é um portfólio de clientes da the med nem uma cópia do conteúdo comercial da referência.

**Há outro projeto Innecta, inspirado em Enter, que deve permanecer separado e protegido.** Esta landing page não autoriza alterações no código, hospedagem ou configurações daquele projeto. Também não autoriza alterações no produto real só porque um módulo aparece na apresentação.

### Identidade atual e histórico — 24/10/2026

A LP passou de **Innecta** para **Interny | Your Medical Journey** em 23/10/2026 e para **the med | Your Medical Journey** em 24/10/2026. A forma visual aprovada é o **wordmark 02 em minúsculas**, reconstruído em contornos vetoriais próprios a partir da opção escolhida. Não é uma substituição por Roobert nem uma identificação de fonte. Roobert continua na tipografia dos textos; a paleta vinho/creme/rosa, a arte médica e as animações aprovadas permanecem.

`assets/the-med-wordmark.svg` e `js/wordmark.js` compartilham os contornos usados nas páginas e no Canvas2D do livro. O símbolo **09**, com variantes em preto, branco, vinho `#84384F` e vinho escuro `#501F30` em `brand/symbol-09/`, é uma marca complementar. O rodapé usa a versão preta, alinhada à esquerda dos textos. O favicon atual usa o símbolo branco sobre **`#501F30`**, 10% menor que na primeira aplicação; **não usa OS**. A introdução mantém os dois fragmentos animados **“Olá.” / “Bem-vindo à”**, com o wordmark SVG oficial.

A capa e os rótulos das sete composições do livro usam o wordmark; **YOUR MEDICAL JOURNEY** e o título “Sua formação médica, por inteiro.” permanecem. Ilustrações, geometria, camadas, rolagem e arraste não foram redesenhados. **OS** não integra a marca principal; continua somente em motivos contextuais e no índice do livro onde já existia.

As oito páginas de módulos receberam uma revisão editorial própria: **quatro seções por rota, sem screenshots, vídeos ou miniaturas de próximo projeto**, com gráficos e seleções locais. Isso não remove o mosaico de interfaces da home nem a mídia pertinente da comunidade e dos percursos. Hero, campo contínuo, lente, globo, galeria e livro mantêm seus comportamentos.

Os screenshots originais e o vídeo demonstrativo conservam a marca **Innecta** embutida nos pixels. São registros do material original, não evidência de uma interface já renomeada. O mosaico não foi reeditado. Os links externos abaixo permanecem. **Não houve migração do backend, da autenticação, dos domínios externos ou do projeto Enter**, que continua original Innecta e separado.

Créditos, prompts, nomes técnicos e registros de procedência preservam os nomes usados em cada etapa. Não substituir cegamente fatos históricos ou condições de licença. A aprovação visual da marca não equivale a pesquisa de disponibilidade, registro ou concessão de direitos. Ver detalhes em `REBRAND-THE-MED.md` e `MODULES-EDITORIAL.md`.

### Destinos públicos usados na navegação

- Produto: [innectaos.vercel.app](https://innectaos.vercel.app/).
- Apresentação: [innecta.vercel.app](https://innecta.vercel.app/).

Esses links são destinos externos preservados após o rebranding; não significam que o backend esteja incluído aqui ou tenha sido renomeado. Não acrescentar e-mails, escritórios, depoimentos, parceiros ou resultados sem comprovação.

## 2. Escopo de produto comunicado

O conteúdo apresenta capacidades e propostas sob a identidade the med. A disponibilidade real de cada funcionalidade deve ser validada no produto antes de transformar texto editorial em promessa de lançamento.

| Área | Papel na trajetória |
| --- | --- |
| **Hoje** | Prioridades, visão do dia e próximos passos conectados ao planejamento. |
| **Trajetória** | Sete perspectivas: **Visão, Currículo Studio, Instituições, Comparar, Residência, Internacional e Meu Caminho**. Organização de experiências, evidências, objetivos e possibilidades. |
| **Explorar** | Descoberta de oportunidades, editais, instituições e congressos; conferência de fontes, requisitos e prazos. |
| **Pesquisa** | Jornada de **15 etapas**, articulada pelo ciclo **Entender, Aplicar, Validar e Entregar**. São quatro movimentos, não quatro etapas substituindo as quinze. Leitura crítica e responsabilidade humana continuam essenciais. |
| **Ligas** | Descoberta de ligas acadêmicas, compreensão de atividades e acompanhamento da participação. |
| **Mentor IA** | Assistente de inteligência artificial para organizar dúvidas, refletir sobre possibilidades e próximos passos. Não apresentar a IA como uma pessoa. |
| **Ultra** | Proposta distinta de **acompanhamento humano por mensagens, revisões e uma sessão mensal de 45 minutos**. Não há contratação neste site. |
| **Acervo** | Aulas e materiais de apoio à formação e a diferentes momentos da trajetória. |
| **Club** | Espaço e experiência de membro em preparação; condições comerciais serão apresentadas no lançamento. Não inventar descontos, parceiros ou benefícios contratados. |

As interfaces mostradas são materiais de demonstração fornecidos para a apresentação. Pessoas, contagens e atividades presentes nessas telas **não comprovam clientes, resultados ou parcerias**. Os avisos de demonstração da mídia remanescente devem ser preservados; as oito rotas de módulos não exibem mais essas interfaces.

## 3. Ordem atual da página inicial

Esta lista corresponde à montagem atual de `js/templates.js`, e não à primeira versão do projeto.

| Ordem | Seção | Conteúdo e decisão aprovada |
| --- | --- | --- |
| 1 | **Hero — `#home`** | Frase editorial com alternância, apresentação the med, campo procedural vinho/creme, lente e convite à exploração. |
| 2 | **Ciência — `#science`** | “A ciência avança no mundo. Sua trajetória começa aqui.” Globo interativo, quatro leituras científicas datadas e quatro referências institucionais independentes. Compartilha a mesma cena de fundo do hero. |
| 3 | **Capacidades — `#partners`** | Lista tipográfica dos caminhos do ecossistema e link para Trajetória. O nome técnico do identificador não significa parceiros comerciais. `#works` permanece como âncora de compatibilidade nesta seção. |
| 4 | **Experiências médicas — `#medical-experiences`** | Galeria interativa com oito programas/instituições internacionais, fotografias reais, requisitos, fontes e créditos. |
| 5 | **Manifesto — `#manifesto`** | “Não é sobre chegar mais rápido. É sobre construir um caminho que faça sentido.” Tipografia grande com revelações por linha. |
| 6 | **Princípios — `#strengths`** | Conectar, Construir e Acompanhar, com três diagramas editoriais próprios e textos preservados. |
| 7 | **Faixa tipográfica** | “Seu futuro é feito de conexões.” Movimento horizontal decorativo. |
| 8 | **Comunidade** | Texto sobre conhecimento que circula e chamada circular para `/comunidade/`. |
| 9 | **Mosaico — `#product-mosaic`** | Quatro linhas diagonais, doze instâncias de oito interfaces reais; movimento de rolagem e telas inteiras dentro dos quadros. |
| 10 | **Livro — `#team`** | “Diferentes formas de avançar”: capa e seis capítulos médicos ilustrados, navegáveis por rolagem, controles e arraste de mouse. O identificador histórico não representa uma equipe de pessoas. |
| 11 | **Rodapé — `#contact`** | Próximo passo, links do produto/apresentação, Percursos, Mentor + Ultra, aviso de pré-lançamento e retorno ao topo. |

**Não restaurar elementos obsoletos por engano:** a grade inicial de oito work cards não está mais na home atual; as oito páginas de módulos continuam existindo. O vídeo/reel da homepage foi removido. Os antigos seis perfis visuais da home deram lugar ao livro. A revisão posterior de 24/10/2026 também retirou a mídia das oito páginas de módulos. Comunidade e Percursos conservam sua mídia e suas narrativas próprias.

## 4. Identidade visual e referências

### Direção the med

- Vinho predominante: **`#501F30`** na identidade atual e nos módulos, com bases como **`#542a37` e `#572335`** preservadas no livro; creme **`#f3eee6`** e rosa **`#d7a5b7`**.
- Roobert nos textos, escala editorial, contraste de pesos, espaços amplos e regras finas. O logotipo é o desenho vetorial 02, independente de fonte.
- A assinatura principal é **the med | Your Medical Journey**, com wordmark 02 em minúsculas e símbolo complementar 09. **OS** não acompanha o nome nem o favicon atual; permanece como motivo contextual e no índice do livro, sem restaurar a antiga estrela de oito pontas.
- O livro deve continuar **adulto, médico e editorial**. Não voltar à estética de fantasia, personagens infantis, paleta arco-íris ou catálogo de telas de software.
- Nenhuma fotografia institucional, ilustração ou interface deve sugerir uma parceria inexistente.

### Referências estudadas

1. **[Monopo Vietnam](https://monopo.vn/):** base de hierarquia, ritmo, proporções, navegação, transições e campo procedural com lente. A implementação usa elementos preservados/adaptados do código público de referência. O conteúdo de clientes, pessoas e escritórios não foi transplantado como se pertencesse a esta marca.
2. **[How to Talk to White Kids About Racism](https://howtotalktowhitekidsaboutracism.com/):** referência de livro ilustrado, composição em camadas, páginas com dobradiça e interação. A geometria e as artes foram produzidas para este projeto, inicialmente sob o nome Innecta e agora apresentadas com o wordmark the med; não se reutilizam os personagens, textos, modelos ou ilustrações da história original.
3. **[Morphin — Viscose Carousel](https://morphin.dev/components/viscose-carousel-interactive-portfolio-gallery):** referência de galeria com entrada, leque, revolução, fusão viscosa e cursor refrativo. O motor e os shaders desta galeria são implementações próprias orientadas pelo comportamento observado; não há inclusão integral do componente, das suas fotografias ou dos seus textos.

### Direitos e limites de reutilização

Disponibilidade pública de um arquivo **não é uma licença de redistribuição**. O uso comercial/redistribuição da Roobert e dos materiais derivados da referência Monopo ainda requer esclarecimento. A licença geral de reutilização do componente Morphin não foi confirmada; não apresentar esta implementação como um componente oficialmente licenciado ou afiliado à plataforma.

Os vídeos decorativos originais com fragmentos da marca Monopo foram rejeitados. Os princípios atuais são diagramas próprios. Manter os registros de origem em `assets/manifest.json`, os créditos fotográficos e os avisos de licença dos runtimes. Não declarar que todo o projeto possui uma única licença permissiva sem uma revisão específica.

## 5. Hero, cena contínua e globo

### Fundo e lente

O hero e a seção de ciência usam **um único canvas e uma única instância da cena**, com buffer do tamanho da viewport. Não são duas animações reiniciadas na emenda nem um canvas gigantesco esticado sobre duas seções.

A rolagem desloca a amostragem do campo procedural. A lente sobe e desaparece gradualmente até o fim do primeiro hero; ao voltar, reaparece de forma contínua. O campo continua por trás da ciência sem uma emenda perceptível. As seis faces do mapa de ambiente da lente deixam de ser calculadas quando ela está ausente.

A inicialização é independente da navegação e do restante das animações. Se WebGL falhar, o conteúdo continua disponível com uma alternativa CSS. **Essa alternativa não reproduz exatamente o shader.** `?webgl=0` força a alternativa do hero para inspeção; não é um seletor global que, por si só, force todos os componentes gráficos da página.

O carregamento original da referência apresentou tela preta durante a inspeção disponível; a causa exata não foi comprovada. Por isso, o projeto não faz uma promessa de equivalência pixel a pixel com a referência em execução.

### Globo

O globo é uma renderização **Canvas2D**, independente do WebGL do fundo, com geografia pontilhada, linhas discretas e Brasil destacado em rosa. Possui SVG estático de reserva.

- Rotação automática lenta; botão de pausa acessível.
- Arraste com mouse em longitude e latitude, limite vertical e desaceleração suave.
- No toque, apenas a intenção horizontal assume o giro; a rolagem vertical da página permanece disponível.
- Setas do teclado quando o globo está focado.
- Pausa e movimento reduzido não impedem o giro manual; removem a continuação automática/inercial pertinente.
- Atualizações suspensas fora da área visível ou em aba oculta, com limpeza de eventos e recursos.

As leituras científicas são uma seleção editorial datada, não um feed em tempo real nem orientação clínica: pangenoma humano, AlphaFold 3, estudo inicial de vacina experimental para câncer pancreático e recomendação da OMS sobre vacina contra malária. NIH, Fiocruz, Institut Pasteur e Karolinska aparecem como referências independentes, sem vínculo institucional. Fontes e ressalvas estão em `SCIENCE-SOURCES.md`.

## 6. Galeria de experiências médicas internacionais

### Conteúdo e data de referência

São **oito programas distintos**, com informações registradas em **23/10/2026**. As instituições não são parceiras da the med, e a seleção não constitui ranking de procura, garantia de vaga ou serviço de candidatura. Os links levam às fontes oficiais; o site não envia inscrições nem pagamentos.

| Instituição | Distinções que não podem ser perdidas |
| --- | --- |
| **Mayo Clinic / Rochester** | Eletivo clínico para estudantes internacionais no último ano, com requisitos clínicos, USMLE Step 1 e escola participante do VSLO. A referência é Rochester, não uma promessa de acesso à unidade da Flórida. |
| **Cleveland Clinic** | O item principal é **observership**, exclusivamente observacional, sem atendimento a pacientes nem crédito acadêmico. Para estudantes internacionais, não estar no último ano na candidatura e concluir a graduação após a visita. O eletivo clínico é outro programa, identificado separadamente. |
| **Yale School of Medicine** | Eletivo para estudantes matriculados, não graduados; requisitos de formação clínica e VSLO. Não confundir com observership. |
| **Harvard Medical School** | Último ano e restrição a instituições internacionais aprovadas. O registro consultado cita, no Brasil, FCMSCSP e Faculdade de Medicina da USP em São Paulo. Não apresentar acesso universal nem novos convênios como disponíveis. |
| **UCL Medical School** | Pelo menos três anos de Medicina, doze meses de formação clínica, inglês e reciprocidade de oportunidades da escola de origem. |
| **University of Oxford** | Eletivo para estudantes, não médicos graduados. A chamada de setembro de 2026 a agosto de 2027 estava encerrada; novas datas não estavam publicadas na consulta. |
| **National University of Singapore** | Anos clínicos e pelo menos um ano de prática clínica. Escolas sem acordo bilateral também podem candidatar estudantes; o caráter clínico ou observacional depende da alocação e das autorizações. |
| **University of Queensland** | Estudantes matriculados com ao menos um semestre clínico; candidatura centralizada. Não há contrato individual de estágio com a escola de origem. |

As janelas mostradas são **registros da consulta**, não disponibilidade atual garantida. Entre elas: Cleveland de 01/12/2026 a 31/01/2027; UCL de 28/09 a 30/10/2026 para o bloco indicado de 2027; Queensland de 30/11 a 14/12/2026; próxima janela trimestral informada pela Mayo em dezembro. Antes de atualizar textos ou orientar uma candidatura, conferir novamente as páginas oficiais de cada programa. Os detalhes e links estão em `js/medical-experiences.js` e `MEDICAL-EXPERIENCES-SOURCES.md`.

### Fotografias autênticas e atribuição

As oito fotografias são de locais reais, com procedência e créditos apresentados também em HTML acessível, na área **Créditos das imagens**. Não foram geradas por IA e não vieram das fotografias do exemplo Morphin.

| Instituição | Autor registrado | Licença registrada |
| --- | --- | --- |
| Mayo | Tony Webster | CC BY-SA 2.0 |
| Cleveland | Cleveland Clinic | CC BY 4.0 |
| Yale | Ajay Suresh | CC BY 2.0 |
| Harvard | SA / Drsamir | Domínio público |
| UCL | Tony Hisgett | CC BY 2.0 |
| Oxford | Julian Herzog | CC BY 4.0 |
| NUS | Joshua Rommel Hayag Vargas | CC BY-SA 4.0 |
| Queensland | Kgbo | CC BY-SA 4.0 |

Fontes, URLs de licença, dimensões e alterações de enquadramento constam em `assets/experiences/credits.json`. Preservar atribuição e condições aplicáveis, inclusive compartilhamento pela mesma licença nos derivados CC BY-SA. Fotografias de campus/bibliotecas não devem ser descritas como o hospital onde ocorrerá um estágio: a Radcliffe Camera é uma referência de Oxford; Wilkins e Mayne representam seus respectivos campi.

### Comportamento atual da galeria

1. **Toda recarga completa começa com uma nova introdução.** Não existe uma flag de “já viu” em sessão ou armazenamento local para suprimir a entrada desta galeria. Ela aguarda a chegada à seção; antes disso, uma pequena prévia da primeira foto e uma instrução evitam um espaço aparentemente vazio.
2. A seção adquire a interação com visibilidade substancial, alinha-se à viewport e só então avança a entrada. A composição nasce de uma semente, lança as imagens, abre o leque, realiza a revolução e se posiciona no arco final. O texto de entrada termina em cerca de **8,84 segundos**, sem contar a espera necessária pelos recursos.
3. A semente pode aguardar em 1,45 segundo até um quadro GPU real ou uma decisão explícita de usar DOM. A tentativa visível de recursos é limitada a **6,5 segundos**; não há espera gráfica indefinida bloqueando conteúdo.
4. Durante a introdução e o percurso normal, a galeria mantém seu palco alinhado. A roda do mouse/trackpad é tratada **em toda a viewport engajada**, inclusive margens e navegação, não somente sobre o canvas. A inércia residual da página é neutralizada localmente sem parar globalmente o mecanismo de rolagem.
5. Depois da entrada, a rolagem percorre **uma instituição adjacente por vez**, em sequência. Um impulso grande não pula silenciosamente as oito opções. A próxima faixa só é liberada quando a anterior se estabiliza e é anunciada. Não há espera longa artificial ou fila de movimentos acumulados.
6. O percurso é reversível. Na primeira/última instituição já estabilizada, o próximo comando para fora libera a página. **Escape** e **Pular galeria** permitem sair durante o percurso. Índice e botões são escolhas explícitas de navegação; focar uma instituição não abre seu site automaticamente.
7. Teclado, mouse e toque seguem o mesmo estado de seleção. No desktop, o arraste angular do mouse gira o arco; no toque, a intenção horizontal é adaptada para o giro; rolagem vertical por toque, pinça, zoom do navegador, Tab, campos de formulário e saltos deliberados de página continuam sendo caminhos acessíveis. Movimento reduzido elimina a introdução/inércia e oferece navegação imediata em repouso.

### Modos gráficos e correções já realizadas

- **WebGL:** fusão viscosa por pixel, fotografias em atlas e cursor refrativo. O canvas só aparece quando as oito células do atlas e um quadro real do shader estão prontos.
- **DOM:** acompanha a geometria, o arco, os cantos arredondados e a seleção, mas **não imita a fusão líquida por pixel**.
- **Sem JavaScript:** os oito artigos completos, fotografias, requisitos, fontes e créditos continuam presentes no HTML.

Foram corrigidos dois problemas reproduzidos em testes: uma notificação tardia da primeira imagem podia rotular uma GPU já pronta como fallback; e uma pausa temporária fora da tela podia forçar a perda do contexto reutilizável, deixando a galeria permanentemente na versão leve. Agora as notificações preservam o modo real, os eventos são associados à geração de recursos correta e cancelamentos temporários não provocam deliberadamente perda do contexto. Perda real do contexto atual ainda conduz ao fallback de forma segura. Descarte final libera os recursos próprios.

O atlas usa células de até 512×341, tamanho total de 1536×1023 para as oito fotos, sem mipmaps; DPR máximo de 1,5. Esses números não incluem o buffer de desenho, imagens decodificadas nem memória do navegador. Trabalho em RAF e carregamentos são controlados por visibilidade e ciclo de vida.

**Limite de validação importante:** o navegador de nuvem registrou `Error creating WebGL context`. Testes de shader em Mesa/EGL e testes automatizados de estado são evidência técnica útil, mas não equivalem à renderização no navegador físico do usuário. A restauração efetiva do modo GPU no **Mac do usuário ainda não foi confirmada**. Não escrever “GPU resolvida no Mac” sem observação direta.

Para investigar na página real, acrescentar **`?galleryDiagnostic=1`**. O painel informa modo, fase, fotos carregadas, revisão do Three, erro capturado e descarte/contexto. É local, opcional, não envia telemetria nem cria outro contexto WebGL. Copiar o diagnóstico exige ação no botão correspondente.

## 7. Livro médico ilustrado

A versão aprovada tem o wordmark vetorial **the med**, a assinatura **YOUR MEDICAL JOURNEY**, o título de capa **“Sua formação médica, por inteiro.”** e seis capítulos:

| Título visível | Conteúdo | Identificador interno preservado |
| --- | --- | --- |
| **ROTINA** | Estudo de anatomia, prioridades e Hoje. | `clareza` |
| **TRAJETÓRIA** | Currículo, planejamento e residência. | `direcao` |
| **OPORTUNIDADES** | Pesquisa, congressos e verificação de fontes. | `descoberta` |
| **PESQUISA** | Quinze etapas, ciclo de quatro movimentos e responsabilidade de quem pesquisa. | `metodo` |
| **LIGAS** | Aprendizado entre pares e simulação acadêmica. | `troca` |
| **ORIENTAÇÃO** | Distinção explícita entre Mentor IA e acompanhamento humano Ultra. | `presenca` |

As cenas mostram adultos fictícios, atlas de anatomia, objetos didáticos, planejamento, revisão de evidências, simulação e orientação acadêmica. São **ilustrações editoriais originais geradas para o projeto**, não fotografias de clientes nem instruções clínicas. A paleta vinho/creme/rosa e a linguagem adulta foram aprovadas. As versões fantasiosas anteriores foram substituídas.

**Não colocar prints do sistema dentro do livro.** Na LP atual, o mosaico separado conserva as interfaces; os módulos editoriais também são livres de screenshots. A composição do livro usa tipografia grande codificada, imagem ilustrada transparente e legendas ancoradas em uma área livre. Os textos são compartilhados entre arte e HTML por `js/book-editorial.js`.

### Mecânica preservada

- Aberturas de **2100×1200**, com duas páginas de 1050×1200.
- Dobradiça de **180°**, páginas predominantemente rígidas, cantos externos arredondados e detalhe sutil na lombada; não um efeito exagerado de folha cilíndrica.
- Rolagem finita controla uma posição determinística, para frente e para trás. Botões, índice e teclado conduzem à mesma posição real de rolagem.
- **Mouse primário:** clicar, segurar e arrastar horizontalmente sobre a arte vira a página; cada gesto é limitado à página adjacente e acomoda no destino mais próximo. Clique sem movimento e cancelamento não causam salto. Toque móvel não é capturado por esse recurso.
- O arraste não mantém um estado paralelo ao scroll nem usa um bloqueio global de rolagem. Cancelamento, perda de captura, resize, aba oculta e descarte liberam a interação.
- No WebGL, fundo/título, ilustração e legendas são camadas separadas; a ilustração tem paralaxe e o texto fica ancorado.
- Sem WebGL, há uma **dobradiça CSS3D real**, com frente/verso e a mesma posição de página, mas imagens achatadas, sem paralaxe independente. Sem JavaScript ou com movimento reduzido, há uma edição semântica legível com imagens e links.

O livro não carrega todas as texturas em GPU de uma só vez. Mantém no máximo dois conjuntos necessários, com uploads menores em viewport móvel, e limita caches. Memória de canvas e composição soma-se à memória de texturas; não apresentar o orçamento do componente como limite total de memória do navegador.

## 8. Mosaico, princípios e páginas internas

O mosaico conserva oito PNGs originais de **2880×1800**, fornecidos para o projeto, distribuídos em doze instâncias de quatro linhas a 45°. `object-fit: contain` mantém a interface inteira dentro do quadro, sem recorte interno, recompressão ou pixels inventados. Quadros podem atravessar naturalmente os limites recortados da seção durante o movimento.

Os três princípios são SVGs editoriais próprios:

- **Conectar:** Currículo, Objetivo e Oportunidades convergem em “Seu caminho”.
- **Construir:** Entender → Aplicar → Validar → Entregar.
- **Acompanhar:** Mentor IA / Inteligência artificial e Ultra / Acompanhamento humano em caminhos complementares.

Não voltar aos vídeos/esferas/letras decorativas descartados. As revelações dos diagramas são finitas; o conteúdo existe sem JavaScript e permanece estável em movimento reduzido.

### Rotas físicas existentes

```text
/
/modulos/trajetoria/
/modulos/hoje/
/modulos/explorar/
/modulos/mentor/
/modulos/acervo/
/modulos/ligas/
/modulos/pesquisa/
/modulos/club/
/comunidade/
/percursos/
/404.html
```

São **onze rotas de conteúdo mais a página 404**. Cada rota de conteúdo é gerada como um diretório com `index.html`; não depende de roteamento client-side ou regra de SPA.

As oito páginas de módulo têm **quatro seções editoriais cada**, cabeçalho e navegação locais, conteúdo médico, gráficos SVG/DOM e seleções ilustrativas. Não contêm screenshots, vídeo, canvas, iframe ou miniatura de próximo projeto. Trajetória tem perspectivas de formação, currículo/evidências, comparação e próximo passo; os sete módulos irmãos têm interações próprias de prioridade, descoberta, orientação, leitura, colaboração, pesquisa e interesses. Nada é salvo ou enviado: não há conta, plano persistente ou serviço de produto executado pela demonstração. Controles nativos/teclado, conteúdo sem JavaScript e movimento reduzido são preservados, sem pinagem de rolagem. Ver `MODULES-EDITORIAL.md`.

Comunidade é uma narrativa sobre conhecimento, pesquisa e colaboração. Percursos contém **Trajetória acadêmica** e **Pesquisa em movimento**, com narrativas em modal e galerias de oito/nove imagens. Não são perfis biográficos inventados. Menu, fechamento por Escape, restauração de foco, links e histórico devem continuar funcionais.

## 9. Arquitetura e arquivos principais

O projeto usa **HTML pré-renderizado, CSS e módulos JavaScript locais**. Não há React, framework de aplicação, API de servidor ou instalação obrigatória de pacotes para construir a versão atual.

| Arquivo/pasta | Responsabilidade |
| --- | --- |
| `build.mjs` | Gera as rotas e copia CSS, JavaScript e assets para `dist/`. |
| `js/templates.js` | Documento HTML, home, navegação e rodapé; fonte de verdade da ordem das seções. |
| `js/content.js` | Metadados globais dos módulos, princípios, comunidade e percursos. |
| `js/wordmark.js`, `js/footer-wordmark.js`, `css/wordmark.css` | Desenho vetorial compartilhado e aplicações locais da identidade. |
| `js/trajectory-page.js`, `js/trajectory.js`, `css/trajectory.css` | Quatro seções e controles editoriais de Trajetória. |
| `js/module-experiences.js`, `js/module-experiences-controller.js`, `css/module-experiences.css` | Renderização, conteúdo e seleções locais dos sete módulos irmãos. |
| `js/pages.js` | Templates de comunidade, percursos e modais; os módulos atuais usam os renderizadores dedicados. |
| `js/app.js` | Integração, navegação, scroll, inicialização preguiçosa e ciclo de vida. |
| `js/hero.js`, `js/hero-copy.js` | Cena procedural/lente e alternância editorial do hero. |
| `js/shared-scene.js` | Continuidade do campo entre hero e ciência, com saída da lente. |
| `js/science-content.js`, `js/science-globe.js` | Conteúdo científico, globo Canvas2D e gestos. |
| `js/principle-visuals.js` | Diagramas SVG dos princípios. |
| `js/medical-experiences.js` | Oito programas, fontes, fotos, créditos e HTML semântico. |
| `js/medical-experiences-controller.js`, `js/experience-engagement.js` | Integração da galeria, alinhamento, percurso finito e acessibilidade. |
| `js/viscose-engine.js`, `js/viscose-shaders.js` | Estado angular, entrada, GPU, atlas e efeito viscoso. |
| `js/experience-diagnostic.js` | Painel local opt-in para investigar o modo gráfico. |
| `js/book-editorial.js`, `js/book-section.js` | Conteúdo médico compartilhado e HTML do livro. |
| `js/book-art.js` | Composição das camadas e imagens do livro; carregamento e propriedade dos canvases. |
| `js/book-controller.js`, `js/book-drag.js` | Relação entre página, scroll, botões e arraste de mouse. |
| `js/book-renderer.js`, `js/book-fallback.js` | Livro WebGL e alternativa CSS3D. |
| `css/` | Estilos gerais e estilos locais de páginas, ciência, princípios, mosaico, galeria e livro. |
| `assets/` | Fontes, interfaces, artes, fotos e registros de procedência locais. |
| `js/vendor/` | Runtimes empacotados localmente. |
| `tests/` e `js/*.test.mjs` | Verificações estruturais, regressões, gestos, renderização e ciclo de vida. |

### Dependências gráficas

- **Three.js r131**, local, com exemplos de pós-processamento; aviso MIT em `js/vendor/THREE-LICENSE.txt`.
- **GSAP 3.7.1**, local; preservar as condições/avisos correspondentes à versão empacotada, sem presumir condições de versões posteriores.
- **LocomotiveScroll**, local, integrado ao mesmo runtime de movimento. Seu estado transformado precisa ser considerado ao medir e alinhar componentes.
- APIs nativas: Canvas2D, WebGL, CSS3D, eventos de ponteiro, observação de visibilidade e preferência de movimento reduzido.

Não atualizar esses runtimes automaticamente: a integração depende de comportamento específico de scroll, renderização e ciclo de vida. Uma atualização exige plano e testes de regressão, não simples troca de arquivo.

## 10. Como executar e publicar

Na raiz do projeto, com Node.js moderno que suporte os módulos ES e o executor `node:test` usado pelo código:

```sh
npm run build
npm run check
npm test
npm run serve
```

- `npm run build` reconstrói **`dist/`** a partir do código-fonte; alterações manuais somente em `dist/` serão perdidas.
- `npm run check` valida a sintaxe dos arquivos principais.
- `npm test` roda verificações de rotas, assets, conteúdo, preservação de seções e comportamentos específicos.
- `npm run serve` usa Python 3 para servir `dist/` em `http://localhost:4173`.
- Na configuração atual, não é necessário `npm install` para esses comandos; os runtimes usados no navegador estão no repositório.

O diretório público de uma hospedagem estática deve ser **`dist/`**. Publicar suas rotas e assets com a estrutura intacta, configurar `404.html` como documento de erro e conferir links profundos diretamente, não apenas a home.

Os caminhos de CSS, JavaScript, imagens e links internos começam em **`/`**. Isso pressupõe publicação na raiz de um domínio/origem. **GitHub Pages ainda não está configurado.** Hospedar em um subdiretório como `usuario.github.io/repositorio/` exige adaptação controlada de base paths ou uso de domínio/raiz apropriado; subir os arquivos ao GitHub não resolve isso automaticamente nem publica o site.

`dist/build.json` e a meta tag `interny-build` permitem comparar a versão gerada com a servida. O nome técnico `interny-build` foi preservado após a identidade the med; não indica uma marca desatualizada no conteúdo. Chaves internas de sessão e histórico também mantêm compatibilidade. O campo de status emitido pelo build não é um relatório automático de QA visual. Publicação, endereço final e funcionamento precisam ser confirmados depois do envio. Não substituir a hospedagem do projeto Enter para colocar esta LP no ar.

## 11. Acessibilidade, desempenho e comportamento de falha

A regra central é **o conteúdo não depender da GPU para existir**. HTML semântico, links, navegação, textos e imagens de reserva devem continuar utilizáveis quando animações, imagens ou contextos gráficos falharem.

Preservar:

- `lang="pt-BR"`, hierarquia de títulos, nomes acessíveis e link para pular ao conteúdo.
- Foco visível, Escape, restauração de foco dos modais e navegação por teclado.
- Ausência de controles de idioma sem função.
- Edições sem JavaScript e com movimento reduzido.
- Rolagem vertical e pinch zoom no mobile; isolamento de gestos horizontais.
- Carregamento local e preguiçoso dos recursos pesados; nenhuma dependência de imagens remotas em runtime.
- Pausa fora da viewport/aba visível, cancelamento de cargas antigas e descarte de texturas, materiais, geometrias, eventos e canvases próprios.
- Cabeçalho oculto e inerte apenas enquanto os palcos que exigem isso estão engajados, com restauração ao sair.
- Distinção honesta entre fallback, teste automatizado e GPU observada no navegador.

## 12. Checklist para a próxima manutenção

### Antes de editar

- [ ] Ler este documento e a versão atual de `js/templates.js`.
- [ ] Definir o componente e o comportamento a alterar; não redesenhar partes já aprovadas por efeito colateral.
- [ ] Manter Enter, backend, autenticação, banco de dados, checkout e Asaas fora do escopo.
- [ ] Preservar os arquivos de referência dos testes; não “corrigir” uma regressão apenas atualizando hashes.
- [ ] Conferir licenças/procedência antes de acrescentar ou redistribuir materiais.

### Antes de publicar

- [ ] Rodar build, sintaxe e testes; verificar arquivos locais ausentes e rotas profundas.
- [ ] Conferir a ordem da home e os links das oito páginas de módulos; manter quatro seções por rota, sem screenshots ou retorno ao antigo estudo de caso.
- [ ] Conferir wordmark 02 proporcional, símbolo 09, favicon branco/vinho escuro, rodapé à esquerda e introdução com SVG; não substituir o logo por texto em Roobert.
- [ ] Testar seleções locais, teclado, atalhos modificados, ausência de persistência e conteúdo sem JavaScript nos módulos.
- [ ] Testar desktop e mobile, menu, modais, retorno ao topo e histórico.
- [ ] Percorrer hero → ciência sem emenda; verificar saída/retorno da lente e arraste/pausa do globo.
- [ ] Recarregar antes, dentro e depois da galeria; confirmar entrada nova ao alcançá-la, sem palco vazio permanente.
- [ ] Percorrer as oito instituições para frente e para trás com pequenos pacotes de trackpad e impulsos grandes, inclusive com cursor nas margens.
- [ ] Conferir Escape, Pular galeria, saída nos extremos, teclado, toque vertical e movimento reduzido.
- [ ] Validar WebGL real em dispositivo capaz; usar o diagnóstico se houver dúvida. Testar falha, aba oculta, saída/retorno e perda de contexto sem presumir que um modo observado em nuvem seja o mesmo do Mac.
- [ ] Virar o livro por scroll, controles e arraste de mouse; testar cancelamento, retorno e alternativa CSS3D.
- [ ] Confirmar que o livro continua médico/vinho e sem prints, e o mosaico continua com interfaces inteiras.
- [ ] Conferir sem JavaScript, fontes lentas e imagens indisponíveis; conteúdo não deve desaparecer.
- [ ] Revisar datas/requisitos institucionais nas fontes oficiais quando forem atualizados; manter créditos e ausência de afiliação.
- [ ] Publicar somente o destino autorizado, conferir versão servida e não alterar a hospedagem do outro projeto.

## 13. Pendências e limites conhecidos

1. **GPU no Mac:** as corridas de estado e o descarte indevido foram reproduzidos e corrigidos, mas a recuperação visual efetiva no dispositivo do usuário permanece sem confirmação direta.
2. **Fidelidade:** não há promessa de equivalência pixel a pixel entre todas as referências, fallbacks e dispositivos. DOM e CSS3D mantêm conteúdo/interação, não todos os efeitos ópticos de GPU.
3. **Licenças:** falta esclarecer a redistribuição/comercialização da Roobert e dos materiais derivados da referência; preservar atribuições e não confundir referência técnica com licença concedida.
4. **Conteúdo temporal:** programas internacionais e regras de candidatura mudam. A data editorial é 23/10/2026, não uma atualização automática.
5. **Pré-lançamento:** a LP não comprova que funcionalidades, acompanhamento ou condições comerciais já estejam liberados no produto.
6. **Hospedagem GitHub Pages:** não configurada; exige decisão de destino e tratamento dos caminhos absolutos.
7. **Validação contínua:** testes de unidade e de shader não substituem QA visual, acessibilidade e comportamento real em Safari/Chrome/Firefox e diferentes dispositivos.

## 14. Documentos complementares do repositório

- `README.md`: comandos e visão técnica curta.
- `REBRAND-THE-MED.md`: identidade atual, wordmark 02, símbolo 09 e limites da mudança.
- `MODULES-EDITORIAL.md`: oito rotas editoriais, quatro seções e interações locais.
- `REBRAND-INTERNY.md`: registro histórico da etapa anterior, não especificação da marca atual.
- `FONTES_E_LICENCAS.md`: direitos de terceiros, avisos e pendências de redistribuição.
- `IMPLEMENTATION.md`: arquitetura atual, responsabilidades, ciclo de vida e manutenção.
- `BOOK-IMPLEMENTATION.md`: arte médica, geometria, camadas, recursos e interação do livro.
- `BOOK-ART-PROMPTS.json`: registro das ilustrações produzidas para o livro.
- `MEDICAL-EXPERIENCES-SOURCES.md`: fontes, direitos fotográficos, interação e correções da galeria.
- `SCIENCE-SOURCES.md`: fontes científicas e referências institucionais da segunda seção.
- `assets/manifest.json` e `assets/experiences/credits.json`: procedência dos materiais e créditos.

**Resumo para retomar:** manter uma apresentação the med completa, médica, vinho/creme e utilizável sem GPU; preservar a animação aprovada do livro e a sequência finita da galeria; comunicar o produto com verdade; alterar apenas o escopo combinado e comprovar o resultado antes de declarar uma correção concluída.

## Atualização mobile e abertura — 24/10/2026

Após relatos de rolagem irregular no iPhone 14/Safari, a entrada principal por toque passou a usar scroll nativo, sem Locomotive. A galeria não alinha nem captura a rolagem vertical nesse modo; seleção por botões e arraste horizontal continuam disponíveis. O livro conserva a altura de referência durante o recolhimento da barra do Safari e recalibra em mudança real de largura/orientação. Menus e modais restauram a posição nativa ao fechar. O comportamento desktop permanece protegido.

A saudação “Olá. Bem-vindo à” com o wordmark oficial inicia por um gate no head, sem flash da frase principal, e reaparece em cada recarregamento completo. Não depende de marca em sessionStorage nem do carregamento de WebGL. Hashes aguardam a abertura; ausência de JavaScript, redução de movimento, erro ou watchdog mantêm a página utilizável.

A galeria mobile usa atlas de 768–1024 pixels por fotografia, até 24 MiB RGBA base, e drawing buffer de até 1,5 milhão de pixels. Não equivale a uma garantia de memória total do navegador. Os testes determinísticos cobrem comportamento e recursos; a validação visual/performance em iPhone físico permanece pendente. Detalhes em `MOBILE-SAFARI.md`.
