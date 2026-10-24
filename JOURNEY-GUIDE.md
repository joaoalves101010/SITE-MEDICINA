# Guia de próximos passos

## Revisão de 24/10/2026

O livro interativo foi retirado da home em desktop e mobile por solicitação do responsável pelo projeto. Não é apenas ocultado: a home não contém sua marcação, canvas, páginas ilustradas, estilos, inicialização ou hooks de rolagem. Os arquivos históricos permanecem no repositório para referência, sem carregamento pela página. A galeria usa um helper de scroll compartilhado independente, sem importar o antigo módulo de arraste do livro.

O mesmo endereço de seção, `#team`, agora apresenta **“Qual é o seu próximo passo?”**. Três intenções organizam orientações e links reais:

- **Organizar minha formação:** prioridade do dia, contexto das experiências e um passo possível — Hoje e Trajetória.
- **Começar uma pesquisa:** pergunta, método e revisão — Pesquisa, com 15 etapas articuladas em quatro movimentos.
- **Encontrar oportunidades:** critérios, comparação e fontes oficiais — Explorar e Internacional em Trajetória.

A escolha é local à página: não salva dados nem aciona backend. Não promete vaga, aprovação, resultado acadêmico ou elegibilidade.

## Implementação e acessibilidade

`js/journey-guide.js` entrega todo o conteúdo em HTML. `js/journey-guide-controller.js` acrescenta tabs locais; `css/journey-guide.css` mantém o fluxo normal e uma altura compartilhada entre painéis, sem pin ou auto-scroll. Sem JavaScript, as três opções continuam legíveis. As setas esquerda/direita, Home e End navegam entre tabs; as setas verticais continuam disponíveis para rolar a página. Há foco visível, sem animação contínua, sem canvas, WebGL, React ou nova dependência.

Referências oficiais consultadas para o padrão, não código de interface copiado:

- [Radix Primitives — Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)
- [WAI-ARIA APG — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

A marca, os textos dos módulos e os demais elementos aprovados da home permanecem fora desta substituição. A revisão móvel da galeria é documentada em `MOBILE-SAFARI.md`.
