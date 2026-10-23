/** Book-only editorial copy. Global product/profile content is deliberately untouched. */
export const bookCover=Object.freeze({
 eyebrow:'FORMAÇÃO MÉDICA, COM CONTEXTO',
 image:'/assets/book-pages/medical-00-cover.webp',
 title:'Sua formação médica, por inteiro.',
 summary:'Do estudo de anatomia ao currículo, da pesquisa às ligas: um olhar conectado para a formação médica.',
 body:'Conheça seis perspectivas da Innecta para organizar o estudo, compreender oportunidades e construir uma trajetória acadêmica com responsabilidade. Plataforma em pré-lançamento.',
 backSummary:'Estudo, trajetória, pesquisa e comunidade.',
 status:'INNECTA / PRÉ-LANÇAMENTO'
});
export const bookEditorialChapters=Object.freeze([
 {
  id:'clareza',title:'Clareza',displayTitle:'ROTINA',role:'ORGANIZAR O ESTUDO',module:'Hoje',href:'/modulos/hoje/',
  summary:'Entre anatomia, aulas e revisões, reconheça o que pede atenção hoje.',
  excerpt:'O Hoje aproxima prioridades e próximos passos para organizar o estudo e os compromissos da formação médica.',
  body:'A formação médica reúne aulas, anatomia, revisões e compromissos. O Hoje propõe aproximar prioridades e próximos passos para organizar a atenção, sem perder de vista o percurso de formação.'
 },
 {
  id:'direcao',title:'Direção',displayTitle:'TRAJETÓRIA',role:'CURRÍCULO E RESIDÊNCIA',module:'Trajetória',href:'/modulos/trajetoria/',
  summary:'Dê contexto ao currículo e aos caminhos para a residência.',
  excerpt:'Experiências da graduação, currículo e escolhas de residência fazem parte de uma trajetória que pode ser revista.',
  body:'Dê contexto às experiências da graduação, ao currículo e aos objetivos de residência. Visão, Currículo Studio, Instituições, Comparar, Residência, Internacional e Meu Caminho conectam diferentes perspectivas para planejar as próximas escolhas.'
 },
 {
  id:'descoberta',title:'Descoberta',displayTitle:'OPORTUNIDADES',role:'OPORTUNIDADES CIENTÍFICAS',module:'Explorar',href:'/modulos/explorar/',
  summary:'Encontre pesquisa, congressos e oportunidades com atenção às fontes.',
  excerpt:'Explore congressos, editais e oportunidades científicas. Requisitos, prazos e fontes ajudam a entender o que faz sentido para você.',
  body:'Encontre oportunidades, editais, instituições e congressos em uma busca mais intencional. Amplie seu repertório de experiências científicas e confira requisitos e prazos nas fontes oficiais.'
 },
 {
  id:'metodo',title:'Método',displayTitle:'PESQUISA',role:'PESQUISA COM RESPONSABILIDADE',module:'Pesquisa',href:'/modulos/pesquisa/',
  summary:'Da pergunta ao projeto: pesquisa com estrutura e responsabilidade.',
  excerpt:'15 etapas, em um ciclo de Entender, Aplicar, Validar e Entregar. Organização para pesquisar com método e leitura crítica.',
  body:'Estruture a pesquisa em uma jornada de 15 etapas, articulada pelos movimentos Entender, Aplicar, Validar e Entregar. Mantenha o raciocínio visível e dê continuidade ao projeto, com orientação, leitura crítica e responsabilidade de quem pesquisa.'
 },
 {
  id:'troca',title:'Troca',displayTitle:'LIGAS',role:'LIGAS E APRENDIZADO ENTRE PARES',module:'Ligas',href:'/modulos/ligas/',
  summary:'A formação médica também se constrói com colegas.',
  excerpt:'Ligas acadêmicas: estudo, simulação e troca entre pares. Na Innecta, o foco é descobrir atividades e acompanhar a participação.',
  body:'Descubra ligas acadêmicas, compreenda suas atividades e acompanhe a própria participação. Aproxime-se de colegas com interesses em comum para compartilhar experiências de estudo, simulação e aprendizado entre pares.'
 },
 {
  id:'presenca',title:'Presença',displayTitle:'ORIENTAÇÃO',role:'IA E ACOMPANHAMENTO HUMANO',module:'Mentor IA + Ultra',href:'/modulos/mentor/',
  summary:'Tecnologia para organizar dúvidas. Pessoas para olhar junto.',
  excerpt:'Mentor IA: inteligência artificial. Ultra: acompanhamento humano por mensagens, revisões e uma sessão mensal de 45 minutos.',
  body:'Organize dúvidas e possibilidades com o Mentor IA, um assistente de inteligência artificial. No Ultra, receba acompanhamento humano por mensagens, revisões e uma sessão mensal de 45 minutos para pensar nos próximos passos.'
 }
].map(chapter=>Object.freeze(chapter)));
