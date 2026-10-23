# Livro editorial médico da Interny

Identidade atual: **Interny | Your Medical Journey** (23/10/2026). A capa e os rótulos editoriais foram atualizados; ilustrações, camadas e mecânica permanecem preservadas.

O livro substitui a antiga apresentação de seis perfis da home em `#team`. Não contém prints do sistema. O mosaico diagonal de prints é outra seção e deve permanecer separado.

## Arte e narrativa aprovadas

Capa: **Sua formação médica, por inteiro.** Seis capítulos: **ROTINA, TRAJETÓRIA, OPORTUNIDADES, PESQUISA, LIGAS e ORIENTAÇÃO**. Ilustrações originais de adultos em contextos reconhecíveis de formação médica, com vinho/bordô predominante, creme e rosa discreto. São cenas acadêmicas fictícias, não atendimento clínico, pessoas reais ou depoimentos.

`BOOK-ART-PROMPTS.json` preserva os prompts. Os PNGs originais, derivados WebP com alfa e provas editoriais estão em `assets/book-pages`. O texto semântico e as páginas usam o conteúdo de `js/book-editorial.js`.

## Mecânica

Folha de proporção 1,05 × 1,20; abertura 2,10 × 1,20. Cantos arredondados, espessura discreta, dobradiça de 180° e pequena dobra junto à lombada. A folha é majoritariamente rígida: não há rolo/cilindro artificial.

Scroll para baixo avança e para cima retorna. Há botões, teclado e arraste com botão principal do mouse. O arraste atualiza a coordenada real de rolagem, evitando saltos ao devolver o controle ao scroll. Cliques em links/controles e gestos verticais móveis não são apropriados indevidamente. O estágio tem orçamento vertical para a folha erguida e mantém controles/captions acessíveis.

O WebGL compõe camadas separadas de fundo/título, ilustração e legenda; a ilustração responde deterministicamente ao ângulo da página. O fallback CSS3D mantém frente/verso e dobradiça, mas usa arte achatada e não reproduz o paralaxe por fragmento. Sem JavaScript ou com movimento reduzido há leitura semântica estática.

## Recursos e limites

No máximo duas composições exigidas por vez no GPU, até seis texturas. Em desktop, camadas2100×1200 representam até60,48MB de RGBA base; até640px são enviadas cópias1050×600, até15,12MB. Essas contas não incluem framebuffer, profundidade, compositor ou CPU. O fallback mantém quatro faces1050×1200, além do cache de composições. Há limpeza de referências, prevenção de resultados assíncronos obsoletos e pausa fora de tela.

A tipografia, o conteúdo médico e a mecânica foram aprovados separadamente. Ao editar arte ou copy, mantenha os renderizadores/controladores intactos salvo pedido explícito. Verifique títulos longos, acentos, legenda livre de sobreposição e o ângulo próximo de90° em tela pequena.
