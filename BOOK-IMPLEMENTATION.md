> **Histórico: livro removido da home em 24/10/2026.** A apresentação ativa foi substituída por `JOURNEY-GUIDE.md`. Este documento e seus arquivos preservam somente a implementação anterior; não são carregados pela home.

# Livro editorial médico — the med

Identidade atual: **the med | Your Medical Journey** (24/10/2026), após as etapas Innecta e Interny. A capa e os rótulos autorais usam o **wordmark vetorial 02 em minúsculas**, com os mesmos contornos de `js/wordmark.js` e `assets/the-med-wordmark.svg`. Não é um logo digitado em Roobert. Textos editoriais continuam em Roobert; ilustrações médicas, camadas, paleta e mecânica permanecem preservadas. **OS** continua apenas no motivo/índice contextual, não na marca principal.

O livro substitui a antiga apresentação de seis perfis da home em `#team`. Não contém prints do sistema. O mosaico diagonal de prints é outra seção e deve permanecer separado.

## Arte e narrativa aprovadas

Capa: **Sua formação médica, por inteiro.** Seis capítulos: **ROTINA, TRAJETÓRIA, OPORTUNIDADES, PESQUISA, LIGAS e ORIENTAÇÃO**. Ilustrações originais de adultos em contextos reconhecíveis de formação médica, com vinho/bordô predominante, creme e rosa discreto. São cenas acadêmicas fictícias, não atendimento clínico, pessoas reais ou depoimentos.

`BOOK-ART-PROMPTS.json` preserva os prompts. Os PNGs originais, derivados WebP com alfa e provas editoriais estão em `assets/book-pages`. O texto semântico e as páginas usam o conteúdo de `js/book-editorial.js`.

## Mecânica

Folha de proporção 1,05 × 1,20; abertura 2,10 × 1,20. Cantos arredondados, espessura discreta, dobradiça de 180° e pequena dobra junto à lombada. A folha é majoritariamente rígida: não há rolo/cilindro artificial.

Scroll para baixo avança e para cima retorna. Há botões, teclado e arraste com botão principal do mouse. O arraste atualiza a coordenada real de rolagem, evitando saltos ao devolver o controle ao scroll. Cliques em links/controles e gestos verticais móveis não são apropriados indevidamente. O estágio tem orçamento vertical para a folha erguida e mantém controles/captions acessíveis.

O WebGL compõe camadas separadas de fundo/título, ilustração e legenda; a ilustração responde deterministicamente ao ângulo da página. O fallback CSS3D mantém frente/verso e dobradiça, mas usa arte achatada e não reproduz o paralaxe por fragmento. Sem JavaScript ou com movimento reduzido há leitura semântica estática.

## Recursos e limites

No máximo duas composições exigidas por vez no GPU, até seis texturas. Em desktop, camadas 2100×1200 representam até 60,48 MB de RGBA base; até 640px são enviadas cópias 1050×600, até 15,12 MB. Essas contas não incluem framebuffer, profundidade, compositor ou CPU. O fallback mantém quatro faces 1050×1200, além do cache de composições. Há limpeza de referências, prevenção de resultados assíncronos obsoletos e pausa fora de tela.

A tipografia, o conteúdo médico e a mecânica foram aprovados separadamente. Ao editar arte ou copy, mantenha os renderizadores/controladores intactos salvo pedido explícito. Verifique títulos longos, acentos, legenda livre de sobreposição e o ângulo próximo de 90° em tela pequena.
