# Mobile Safari: rolagem e apresentação

## Revisão orientada pelo vídeo — 24/10/2026

Um vídeo de uso real em iPhone 14/Safari mostrou a galeria ainda na fase pequena de sua abertura enquanto a pessoa já avançava pela página. A fotografia ocupava aproximadamente 46–55 CSS pixels entre 14,5 e 16,5 segundos do registro; aos 17 segundos, os detalhes já estavam em vista. Aumentar a resolução do atlas não resolve esse atraso de apresentação. O vídeo não prova flash do novo documento antes da saudação: a página anterior aparece antes do indicador de recarregamento.

A revisão atual, portanto, mantém a saudação de primeiro frame e muda **somente a experiência da galeria para entrada principal por toque**:

- Fotografias grandes e nítidas desde a apresentação, usando os WebP autênticos existentes diretamente em `img`.
- Deslizamento horizontal nativo, com snap por proximidade, botões, contador e detalhes da instituição escolhida.
- Sem intro longa, shader, atlas, contexto WebGL, captura de gesto vertical, pin ou alinhamento automático nessa galeria móvel.
- A rolagem vertical e o zoom permanecem do navegador; seleção por botões desloca apenas o contêiner horizontal.
- Critérios de participação, datas, links oficiais e créditos das oito fotografias permanecem.

O desktop conserva a galeria líquida, seu cursor, a abertura e a progressão finita por scroll. O livro foi removido de ambas as versões e substituído pelo guia leve descrito em `JOURNEY-GUIDE.md`.

## Infraestrutura mantida

Dispositivos com entrada principal por toque usam rolagem nativa em vez de Locomotive. Coordenadas vêm do scroll real da janela. Menus e modais preservam/restauram o offset ao fechar. Desktop com ponteiro fino mantém o motor aprovado. O helper de posicionamento imediato neutraliza temporariamente `scroll-behavior:smooth`, sem deixar um bloqueio global.

A saudação da home inicia no head e reaparece em cada recarregamento completo. Não usa flag de sessão, não depende de WebGL e adia hashes até o fim da abertura. JavaScript indisponível, redução de movimento, erro ou watchdog mantêm a página utilizável. O vídeo não justificou uma nova alteração desse mecanismo.

## Recursos e limites da validação

O caminho móvel da galeria deixa de alocar atlas/drawing buffer. A política Retina adicionada anteriormente permanece no motor histórico, mas não é executada pela galeria nativa. As imagens mantêm suas dimensões originais de distribuição e licenças; não há ampliação por IA.

Testes cobrem a ausência de importação do motor no mobile, scroll horizontal local, seleção, teclado, resize, descarte, conteúdo sem JS e preservação do caminho desktop. O vídeo recebido foi evidência do problema anterior, não validação da versão corrigida. A aparência, fluidez e comportamento da nova versão ainda precisam ser confirmados em um iPhone físico; testes de código não substituem essa confirmação.

## Continuidade visual e navegação diferida

O vídeo também mostrou bordas retangulares do fundo da própria página durante o deslocamento. No mobile compatível, o fundo compartilhado de hero/ciência agora usa posicionamento sticky nativo, em vez de receber uma translação JavaScript a cada evento. `overflow:clip` nos ancestrais evita criar um contêiner de scroll que quebre o sticky; a altura estável de viewport grande cobre a área enquanto a barra do Safari muda. A margem negativa equivalente preserva a altura do conteúdo. O caminho desktop continua com sua compensação aprovada.

As atualizações móveis de uniforms são agrupadas no RAF, e eventos de resize sem mudança real das dimensões do canvas não realocam o renderer/composer. Os testes verificam ausência de translação de posicionamento móvel, reversibilidade do campo/lente e zero realocações em mudanças apenas da barra, com recalibração em largura/orientação real.

Foi identificado ainda um caminho capaz de sobrescrever um gesto: um hash inicial aguardava 6,8 segundos para deslocar a página após a saudação. A gravação não revela o fragmento da URL, portanto não prova que esse era o caso específico, embora o horário coincida com a descontinuidade observada. No mobile, touchmove, wheel ou tecla de navegação agora cancelam esse deslocamento automático pendente; o fragmento continua na URL. Saída/BFCache também invalida a ação atrasada. Nenhum desses listeners captura ou impede a rolagem.


## Ajuste pontual — posição estável da lente no mobile (24/10/2026)

Após a aprovação da navegação mobile, somente o deslocamento da esfera do hero pelo scroll e a câmera que seguia o toque foram desativados no home touch. A esfera continua sendo o mesmo vidro WebGL: shaders, refração, captura cúbica e movimento interno do campo permanecem. O fade já existente encerra a lente antes da ciência; o fundo sticky contínuo não muda. A representação de reserva também mantém sua posição, caso o WebGL realmente esteja indisponível. Desktop, demais rotas e abertura preservam o comportamento anterior. Testes verificam posição fixa, refração/cubemap ativos, evolução do tempo e retorno após subir a página; não substituem a conferência visual no iPhone físico.
