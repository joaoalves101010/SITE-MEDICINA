# Rolagem móvel e abertura — 24/10/2026

Revisão motivada por um relato de rolagem instável no **iPhone 14 / Safari**. O comportamento de desktop aprovado continua usando o mesmo runtime de rolagem, geometria, física da galeria, arte e gestos do livro.

## Alterações delimitadas

- Dispositivos cujo ponteiro principal é de toque usam a rolagem nativa do navegador. Os controladores leem a posição real da janela, não uma posição virtual antiga.
- No toque, a galeria começa sua introdução quando aparece de forma significativa, sem alinhar compulsoriamente a página nem prender o gesto vertical. O gesto horizontal deliberado e os botões continuam selecionando instituições. No desktop, a introdução e a sequência finita das oito instituições continuam com o controle de scroll aprovado e saídas acessíveis.
- O percurso do livro mantém uma altura estável durante mudanças da barra de endereço do navegador. Mudanças reais de largura/orientação recalculam a geometria e preservam a posição de leitura quando o livro está em foco.
- Menu e modal conservam a posição nativa durante a abertura e a restauram ao fechar, sem deixar um bloqueio permanente de rolagem.
- A saudação da home começa no primeiro paint em cada carregamento completo. Não usa um sinalizador de “já visto”. O gate inicial não depende de GSAP, WebGL ou de fontes carregadas; JavaScript ausente, movimento reduzido e falhas têm saída legível. Um watchdog independente limita a duração do gate.
- Links com fragmento são respeitados após a abertura, sem mostrar previamente outra seção por restauração automática do navegador.

## Evidência e limites

Antes da revisão, um teste determinístico reproduziu um alinhamento programático da galeria enquanto um toque vertical ainda estava em andamento. Outro mostrou que mudar apenas a altura de viewport alterava o percurso e a página do livro no mesmo deslocamento. Os testes de regressão cobrem essas transições, o modo desktop, cancelamento, visibilidade, teclado, reload e as saídas de falha.

Testes de código e limites de recursos não substituem uma verificação no aparelho. A validação final de toque, barra de endereço, pinch zoom e nitidez do renderer deve ser repetida no iPhone/Safari e no navegador de desktop usado para aprovação. Esta revisão não altera conteúdo editorial, fotografias, SVGs de marca, backend ou destinos externos.

## Nitidez da galeria em telas Retina

A política de qualidade é restrita a dispositivos com entrada principal por toque. O desktop mantém o atlas de 512 × 341 pixels por fotografia e o limite anterior de DPR 1,5. No mobile, o atlas usa células de 768 ou 1024 pixels de largura, respeitando `MAX_TEXTURE_SIZE` e 24 MiB de armazenamento RGBA base. O drawing buffer adapta o DPR até 3, com teto de 1,5 milhão de pixels; em uma área de 390 × 591 CSS pixels, o DPR calculado é aproximadamente 2,55 e o atlas ocupa 13,5 MiB. Esses valores não incluem memória adicional do driver, antialiasing, profundidade, compositor ou imagens decodificadas.

As fotografias autênticas existentes são reaproveitadas, sem ampliação por IA. O atlas e o contexto não são recriados a cada resize; alterações reais da área podem redimensionar apenas o drawing buffer. Os testes verificam limites, preservação da configuração desktop, identidade das imagens e liberação dos recursos. A nitidez percebida e a fluidez no iPhone físico ainda precisam de confirmação no dispositivo.
