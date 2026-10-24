/**
 * THE MED — editorial content for the independent Monopo-inspired site.
 * Product scope was supplied by the owner; images are the supplied demonstration UI.
 * No pictured demonstration member, institution or league is presented as an endorsement.
 */
export const productUrl = 'https://innectaos.vercel.app/';
export const siteUrl = 'https://innecta.vercel.app/';
export const launchStatus = 'Em preparação';
export const imageNotice = 'Interface de demonstração da THE MED, preservada com a identidade visual anterior do produto. Pessoas, números e atividades exibidos nas telas são exemplos, não resultados ou parcerias anunciadas.';
const asset = name => `/assets/${name}`;
const section = (eyebrow, title, body, image, extra = {}) => ({ eyebrow, title, body, image: asset(image), ...extra });

export const projects = [
  {
    slug: 'trajetoria', number: '01', title: 'Trajetória', category: 'DIREÇÃO · CURRÍCULO · POSSIBILIDADES',
    summary: 'Onde você está. Aonde quer chegar. O que faz sentido agora.',
    description: 'Uma formação não cabe em uma lista de certificados. Trajetória conecta o que você já construiu às escolhas que vêm pela frente — com visão, evidências e um caminho que pode mudar com você.',
    heroLine: 'O seu caminho não precisa ser igual ao de ninguém.',
    intro: 'Entre a graduação e o próximo grande passo, há decisões pequenas que importam. A THE MED reúne essas decisões em um espaço: objetivos, currículo, instituições, residência, experiências internacionais e ações para o seu momento.',
    cover: asset('vision-detail.webp'), image: asset('vision.webp'), accent: '#6b272f',
    details: [{label:'Universo',value:'Trajetória acadêmica médica'}, {label:'Dentro do módulo',value:'Sete perspectivas conectadas'}, {label:'Momento',value:'Produto em preparação'}],
    bullets: ['Visão', 'Currículo Studio', 'Instituições', 'Comparar', 'Residência', 'Internacional', 'Meu Caminho'],
    sections: [
      section('01 / UM PONTO DE PARTIDA', 'O caminho começa no seu contexto.', 'Antes de escolher uma direção, vale reconhecer o ponto de partida. Seus interesses, experiências e o tempo disponível fazem parte da decisão. Trajetória reúne essas perspectivas para que um objetivo não seja apenas uma referência distante.', 'vision.webp'),
      section('02 / VISÃO', 'Antes de escolher, enxergar.', 'Uma visão da sua trajetória coloca objetivos, experiências e possibilidades no mesmo contexto. Não é sobre seguir a rota mais concorrida: é sobre entender as opções e reconhecer o próximo passo possível para você.', 'vision-detail.webp'),
      section('03 / CURRÍCULO', 'Uma história feita de experiências.', 'Projetos, atividades, participação e aprendizado contam partes diferentes da sua formação. Reunir essas experiências ajuda a reconhecer o que já foi construído e o que ainda precisa de desenvolvimento, sem reduzir a trajetória a um número.', 'cv.webp'),
      section('04 / CURRÍCULO STUDIO', 'O que você viveu merece ser bem contado.', 'Organize informações, reúna comprovações e trabalhe a apresentação do currículo. O Currículo Studio foi pensado para transformar atividades dispersas em uma história clara, sem confundir informação declarada com experiência comprovada.', 'cv-detail.webp'),
      section('05 / INSTITUIÇÕES', 'Um lugar também é uma escolha.', 'Acompanhe instituições do seu interesse e aproxime a pesquisa dos seus objetivos. O espaço ajuda a organizar referências para que uma possibilidade encontrada não se perca entre abas e anotações.', 'instituicoes-detail.webp'),
      section('06 / COMPARAR', 'Olhar lado a lado muda a decisão.', 'Compare caminhos a partir do seu momento: dedicação, horizonte e relação com os objetivos. A comparação serve para tornar as diferenças visíveis — não para prometer uma escolha certa para todo mundo.', 'trajetoria-comparar.png'),
      section('07 / RESIDÊNCIA', 'O futuro começa a ganhar contorno.', 'Acompanhe a preparação curricular para a residência e reconheça o que ainda precisa de atenção. Editais e critérios pertencem às instituições responsáveis; a plataforma é um apoio para organizar a leitura e o planejamento.', 'residencia-detail.webp'),
      section('08 / INTERNACIONAL', 'O horizonte pode ir mais longe.', 'Explore possibilidades de formação e experiência no exterior, com espaço para pensar em preparação e viabilidade. Cada percurso tem requisitos próprios, que precisam ser conferidos nas fontes oficiais.', 'internacional-detail.webp'),
      section('09 / MEU CAMINHO', 'Uma intenção vira um próximo passo.', 'Meu Caminho conecta horizontes maiores a ações menores. Você acompanha o que vem agora, revê prioridades e mantém o planejamento próximo da vida real — com espaço para ajustar a rota.', 'path-detail.webp'),
      section('10 / EVIDÊNCIAS E VERSÕES', 'O detalhe sustenta a história.', 'Uma experiência pode precisar de documentação e de uma apresentação diferente para cada contexto. Manter informações e comprovantes organizados facilita essa revisão. O currículo é um documento em desenvolvimento, não uma versão definitiva de quem você é.', 'cv-detail.webp'),
      section('11 / A SEMANA REAL', 'Um plano precisa caber na vida.', 'A direção ganha força quando encontra espaço na rotina. O próximo passo pode ser revisar um documento, entender um requisito ou retomar uma pergunta. A conexão com Hoje aproxima essas ações do momento em que você pode realizá-las.', 'home-detail.webp'),
      section('12 / CONTINUIDADE', 'Nenhuma escolha vive sozinha.', 'Uma possibilidade descoberta em Explorar, um projeto de Pesquisa, a participação em uma Liga e uma conversa com o Mentor IA podem alimentar a trajetória. O acompanhamento humano Ultra tem um papel próprio nessa relação: mensagens, revisões e uma sessão mensal de 45 minutos para olhar o caminho junto.', 'path.webp')
    ],
    gallery: ['vision.webp','cv.webp','instituicoes-detail.webp','trajetoria-comparar.png','residencia-detail.webp','internacional-detail.webp','path.webp'].map(asset),
    next: 'hoje'
  },
  {
    slug: 'hoje', number: '02', title: 'Hoje', category: 'FOCO · PRIORIDADES · CONTINUIDADE',
    summary: 'Um ponto de partida para o que importa no seu dia.',
    description: 'Uma visão simples do agora: prioridades, prazos e os próximos passos da sua trajetória. Para começar com contexto, em vez de recomeçar do zero a cada acesso.',
    heroLine: 'Grandes trajetórias também se constroem hoje.',
    intro: 'Quando tudo parece urgente, uma boa pergunta é: o que merece atenção agora? Hoje aproxima o seu planejamento da rotina e reúne os caminhos de entrada para o restante da THE MED.',
    cover: asset('home-detail.webp'), image: asset('home.webp'), accent: '#d8c0ad',
    details: [{label:'Universo',value:'Seu espaço acadêmico'}, {label:'Foco',value:'Prioridades e próximos passos'}, {label:'Momento',value:'Produto em preparação'}],
    bullets: ['Visão do dia', 'Prioridades', 'Próximos passos'],
    sections: [
      section('01 / UM COMEÇO CLARO', 'Menos dispersão. Mais direção.', 'Hoje reúne o que precisa da sua atenção e oferece um ponto de partida para a rotina acadêmica. Da organização inicial ao acompanhamento dos próximos passos, o objetivo é reduzir a distância entre saber o que fazer e começar.', 'home-detail.webp'),
      section('02 / CONTINUIDADE', 'O dia conversa com o caminho.', 'As pequenas ações ganham contexto quando estão conectadas a um objetivo. A visão de hoje encontra o planejamento da trajetória para que uma tarefa não seja apenas mais uma tarefa na lista.', 'path-detail.webp')
    ],
    gallery: ['home.webp','home-detail.webp','path.webp'].map(asset), next: 'explorar'
  },
  {
    slug: 'explorar', number: '03', title: 'Explorar', category: 'OPORTUNIDADES · EDITAIS · CONGRESSOS',
    summary: 'Possibilidades que fazem sentido para a sua formação.',
    description: 'Oportunidades, editais, instituições e congressos em um espaço de descoberta. Um jeito de pesquisar com contexto e levar o que faz sentido para o seu planejamento.',
    heroLine: 'Há caminhos que você ainda não encontrou.',
    intro: 'Descobrir não deveria depender de estar no grupo certo na hora certa. Explorar organiza possibilidades de formação e aproxima a busca dos seus interesses, sem substituir a conferência de prazos e requisitos nas fontes oficiais.',
    cover: asset('explore-detail.webp'), image: asset('explore.webp'), accent: '#70454c',
    details: [{label:'Universo',value:'Descoberta acadêmica'}, {label:'Dentro do módulo',value:'Oportunidades, editais, instituições e congressos'}, {label:'Momento',value:'Produto em preparação'}],
    bullets: ['Oportunidades', 'Editais', 'Instituições', 'Congressos'],
    sections: [
      section('01 / DESCOBRIR', 'Expandir o repertório de possibilidades.', 'Explore oportunidades e eventos que podem fazer parte da sua formação. A proposta é reunir pontos de partida para uma pesquisa mais intencional — com atenção ao seu contexto, ao prazo e à origem da informação.', 'explore-detail.webp'),
      section('02 / DAR CONTEXTO', 'Encontrar é só o começo.', 'Uma oportunidade precisa conversar com o seu caminho. Ao olhar também para as instituições e para o que você busca construir, a descoberta pode se transformar em uma escolha mais consciente.', 'instituicoes-detail.webp')
    ],
    gallery: ['explore.webp','explore-detail.webp','instituicoes-detail.webp'].map(asset), next: 'mentor'
  },
  {
    slug: 'mentor', number: '04', title: 'Mentor + Ultra', category: 'CONTEXTO · CONVERSA · ACOMPANHAMENTO',
    summary: 'Tecnologia para organizar. Presença humana para aprofundar.',
    description: 'Mentor IA e acompanhamento Ultra ocupam papéis diferentes e complementares: um espaço para trabalhar dúvidas e próximos passos, e uma proposta de acompanhamento humano para revisar e aprofundar o caminho.',
    heroLine: 'Você não precisa decidir tudo sozinho.',
    intro: 'Uma trajetória pede reflexão, conversa e revisões. A proposta da THE MED aproxima esses momentos do planejamento, distinguindo o apoio do Mentor IA do acompanhamento humano previsto no Ultra.',
    cover: asset('mentor-detail.webp'), image: asset('mentor.webp'), accent: '#752835',
    details: [{label:'Universo',value:'Orientação de trajetória'}, {label:'Ultra',value:'Mensagens, revisões e sessão mensal de 45 minutos'}, {label:'Momento',value:'Proposta em pré-lançamento'}],
    bullets: ['Mentor IA no contexto da trajetória', 'Mensagens com acompanhamento humano', 'Revisões', 'Uma sessão mensal de 45 minutos no Ultra'],
    sections: [
      section('01 / MENTOR IA', 'Perguntas melhores. Próximos passos mais claros.', 'Um assistente de inteligência artificial para conversar sobre a trajetória, organizar dúvidas e trabalhar possibilidades. O Mentor IA apoia a reflexão e a organização; não substitui os responsáveis acadêmicos, as fontes oficiais ou uma decisão que é sua.', 'mentor-detail.webp'),
      section('02 / ACOMPANHAMENTO ULTRA', 'O tempo de olhar junto.', 'A proposta Ultra inclui acompanhamento humano por mensagens, revisões e uma sessão mensal de 45 minutos. Um espaço para revisitar escolhas e trabalhar o caminho com atenção. A oferta está em preparação; não há contratação neste site.', 'acompanhamento.png')
    ],
    gallery: ['mentor.webp','mentor-detail.webp','acompanhamento.png'].map(asset), next: 'acervo'
  },
  {
    slug: 'acervo', number: '05', title: 'Acervo', category: 'CONHECIMENTO · AULAS · MATERIAIS',
    summary: 'Conhecimento que acompanha o seu momento.',
    description: 'Um espaço para reunir aulas e materiais de apoio à trajetória. Conteúdo que pode ser retomado quando uma nova pergunta, escolha ou etapa pede um olhar mais atento.',
    heroLine: 'Aprender também é saber aonde voltar.',
    intro: 'O valor de um material não está apenas em estar disponível. Está em chegar no momento em que ajuda a entender, aplicar ou decidir. O Acervo organiza esse ponto de encontro entre conteúdo e trajetória.',
    cover: asset('acervo.png'), image: asset('acervo.png'), accent: '#c8b0a4',
    details: [{label:'Universo',value:'Formação e repertório'}, {label:'Dentro do módulo',value:'Aulas e materiais de apoio'}, {label:'Momento',value:'Acervo em preparação'}],
    bullets: ['Aulas', 'Materiais', 'Organização por momento da trajetória'],
    sections: [
      section('01 / REPERTÓRIO', 'Um lugar para continuar aprendendo.', 'Aulas e materiais reunidos para apoiar diferentes momentos da formação médica. A proposta do Acervo é facilitar o encontro com um conteúdo útil, sem transformar aprender em apenas acumular mais itens para assistir.', 'acervo.png'),
      section('02 / APLICAR', 'O conhecimento encontra uma pergunta real.', 'Uma decisão de trajetória ou uma etapa de pesquisa pode revelar exatamente o que falta entender. O Acervo conversa com esses contextos para que o estudo tenha uma aplicação próxima.', 'pesquisa-manual.png'),
      section('03 / RETOMAR', 'Voltar faz parte de avançar.', 'Há conteúdos que mudam de significado conforme a experiência cresce. Um espaço organizado permite retomar referências e voltar a uma pergunta com novos recursos para respondê-la.', 'mentor-detail.webp')
    ],
    gallery: ['acervo.png','pesquisa-manual.png','mentor-detail.webp'].map(asset), next: 'ligas'
  },
  {
    slug: 'ligas', number: '06', title: 'Ligas', category: 'COMUNIDADE · PARTICIPAÇÃO · EXPERIÊNCIA',
    summary: 'Conectar interesses. Participar de verdade.',
    description: 'Um espaço para descobrir ligas acadêmicas, compreender suas atividades e acompanhar a participação. Porque uma experiência coletiva é mais do que um nome no currículo.',
    heroLine: 'A formação também acontece no encontro.',
    intro: 'Uma liga pode ser o primeiro contato com uma área, uma pergunta de pesquisa ou um grupo de pessoas com interesses próximos. Na THE MED, a proposta é dar contexto à descoberta e continuidade à participação.',
    cover: asset('ligas-detail.webp'), image: asset('ligas-inicio.png'), accent: '#563b3e',
    details: [{label:'Universo',value:'Ligas acadêmicas'}, {label:'Dentro do módulo',value:'Descoberta, participação e atividades'}, {label:'Momento',value:'Ambiente de demonstração'}],
    bullets: ['Buscar ligas', 'Minhas ligas', 'Atividades e participação'],
    sections: [
      section('01 / ENCONTRAR', 'Comece por um interesse em comum.', 'Busque ligas e entenda o que cada espaço propõe. A descoberta ganha sentido quando você consegue olhar para as atividades e para a relação entre a experiência e o seu momento de formação.', 'ligas-buscar.png'),
      section('02 / PARTICIPAR', 'Não é só entrar. É fazer parte.', 'Acompanhe os espaços dos quais participa e mantenha as atividades próximas da rotina. A proposta é dar visibilidade ao trabalho coletivo, não reduzir a participação a uma linha no currículo.', 'ligas-detail.webp'),
      section('03 / CONSTRUIR JUNTO', 'O que o grupo faz também conta.', 'Uma visão das atividades ajuda a entender a vida de uma liga: encontros, projetos e participação. As ligas e pessoas exibidas nas telas deste site são demonstrações da interface, não parcerias anunciadas.', 'ligas-projeto.png')
    ],
    gallery: ['ligas-inicio.png','ligas-buscar.png','ligas-detail.webp','ligas-projeto.png'].map(asset), next: 'pesquisa'
  },
  {
    slug: 'pesquisa', number: '07', title: 'Pesquisa', category: 'PERGUNTA · MÉTODO · ENTREGA',
    summary: 'Da curiosidade a um projeto que ganha forma.',
    description: 'Um ambiente de pesquisa com 15 etapas e um ciclo de trabalho claro: Entender, Aplicar, Validar e Entregar. Para manter a pergunta, o método e a próxima entrega no mesmo contexto.',
    heroLine: 'Toda pesquisa começa com uma boa pergunta.',
    intro: 'Começar pode ser difícil quando o processo parece maior do que a ideia. A THE MED organiza o caminho de pesquisa em 15 etapas, com explicações, ferramentas e registro do trabalho. É apoio ao processo, não substituição do orientador, da instituição ou da avaliação ética aplicável.',
    cover: asset('research-detail.webp'), image: asset('research.webp'), accent: '#914553',
    details: [{label:'Universo',value:'Pesquisa científica'}, {label:'Estrutura',value:'15 etapas de projeto'}, {label:'Ciclo',value:'Entender · Aplicar · Validar · Entregar'}],
    bullets: ['15 etapas', 'Entender', 'Aplicar', 'Validar', 'Entregar'],
    sections: [
      section('01 / COMEÇAR', 'A curiosidade precisa de espaço.', 'O painel de pesquisa aproxima referências, ideias e projetos. Antes de correr para uma entrega, há espaço para observar o que desperta interesse e transformar uma curiosidade em uma pergunta que merece ser investigada.', 'pesquisa-painel.png'),
      section('02 / ENTENDER', 'Compreender antes de preencher.', 'Cada etapa pede uma compreensão do que está sendo construído e por quê. O manual oferece apoio conceitual para que os termos e as decisões do processo não sejam apenas campos em um formulário.', 'pesquisa-manual.png'),
      section('03 / APLICAR', 'A ideia encontra o trabalho.', 'Ferramentas ajudam a levar a compreensão para dentro do projeto. A proposta é trabalhar a pergunta e os componentes da pesquisa em um ambiente conectado, mantendo o raciocínio próximo do que está sendo produzido.', 'pesquisa-ferramentas.png'),
      section('04 / VALIDAR', 'Saber o que ainda precisa de atenção.', 'Verificações explícitas ajudam a revisar o que foi construído antes de seguir. Validar não significa uma aprovação científica automática: orientação, revisão responsável e exigências institucionais continuam essenciais.', 'research-detail.webp'),
      section('05 / ENTREGAR', 'Cada etapa deixa algo concreto.', 'Uma etapa ganha continuidade quando a entrega fica registrada no projeto. A THE MED propõe um processo em que compreender, fazer e revisar conduzem a um resultado que pode ser retomado e desenvolvido.', 'pesquisa-projetos.png'),
      section('06 / CONTINUAR', 'Quinze etapas. Um fio de raciocínio.', 'O trabalho científico não acontece todo de uma vez. Ao organizar 15 etapas com o ciclo Entender, Aplicar, Validar e Entregar, o ambiente mantém visível tanto o ponto em que você está quanto o que vem depois.', 'research.webp')
    ],
    gallery: ['pesquisa-painel.png','pesquisa-manual.png','pesquisa-ferramentas.png','research-detail.webp','pesquisa-projetos.png','research.webp'].map(asset), next: 'club'
  },
  {
    slug: 'club', number: '08', title: 'Club', category: 'PERTENCIMENTO · EXPERIÊNCIA · CONTINUIDADE',
    summary: 'Uma experiência que continua além da próxima tarefa.',
    description: 'O Club reúne a proposta de experiência de membro da THE MED em um espaço próprio. Um lugar para acompanhar o que faz parte dessa relação com a plataforma.',
    heroLine: 'Fazer parte também é construir o que vem.',
    intro: 'A THE MED está sendo preparada para acompanhar uma trajetória, não apenas uma visita. O Club representa essa continuidade. Os benefícios e condições de lançamento serão apresentados nos canais oficiais quando definidos.',
    cover: asset('club-detail.webp'), image: asset('club-detail.webp'), accent: '#34272a',
    details: [{label:'Universo',value:'Experiência de membro'}, {label:'Foco',value:'Pertencimento e continuidade'}, {label:'Momento',value:'Proposta em preparação'}],
    bullets: ['Experiência de membro', 'Um espaço próprio', 'Condições a apresentar no lançamento'],
    sections: [
      section('01 / PERTENCER', 'Um lugar para a sua relação com a THE MED.', 'O Club dá forma à experiência de membro. A interface apresentada é uma prévia: valores, condições, parceiros e benefícios ilustrados não constituem uma oferta comercial deste site.', 'club-detail.webp'),
      section('02 / CONTINUAR', 'A trajetória não termina em uma entrega.', 'Aprender, rever escolhas e descobrir novas possibilidades fazem parte do mesmo caminho. A proposta do Club acompanha essa relação contínua com a THE MED, junto aos demais espaços da plataforma.', 'acervo.png')
    ],
    gallery: ['club-detail.webp','acervo.png'].map(asset), next: 'trajetoria'
  }
];

export const principles = [
  { number: '01', title: 'CONECTAR', word: 'Contexto', body: 'O currículo não vive separado das suas escolhas. Conectamos o que você já fez, o que busca e as possibilidades que podem fazer sentido agora.', description: 'O currículo não vive separado das suas escolhas. Conectamos o que você já fez, o que busca e as possibilidades que podem fazer sentido agora.', icon: 'orbit', href: '/modulos/trajetoria/' },
  { number: '02', title: 'CONSTRUIR', word: 'Método', body: 'Uma boa intenção precisa encontrar um próximo passo. Organizamos o caminho para que descobrir, aprender e fazer não sejam experiências isoladas.', description: 'Uma boa intenção precisa encontrar um próximo passo. Organizamos o caminho para que descobrir, aprender e fazer não sejam experiências isoladas.', icon: 'ribbon', href: '/modulos/pesquisa/' },
  { number: '03', title: 'ACOMPANHAR', word: 'Presença', body: 'Tecnologia faz mais sentido quando preserva o espaço da conversa. O Mentor IA e a proposta de acompanhamento humano Ultra ajudam a olhar o caminho com mais atenção.', description: 'Tecnologia faz mais sentido quando preserva o espaço da conversa. O Mentor IA e a proposta de acompanhamento humano Ultra ajudam a olhar o caminho com mais atenção.', icon: 'sphere', href: '/modulos/mentor/' }
];

export const process = [
  { number:'01', title:'Entender', body:'Dar contexto à pergunta e compreender o que precisa ser construído.' },
  { number:'02', title:'Aplicar', body:'Levar o aprendizado para o trabalho concreto dentro do projeto.' },
  { number:'03', title:'Validar', body:'Revisar, reconhecer limites e identificar o que exige atenção.' },
  { number:'04', title:'Entregar', body:'Registrar o resultado da etapa e preparar a continuidade.' }
];

export const profiles = [
  { id:'clareza', slug:'clareza', title:'Clareza', name:'Clareza', category:'O QUE IMPORTA AGORA', role:'O QUE IMPORTA AGORA', summary:'Um bom começo não precisa ser um plano perfeito.', body:'Clareza é reconhecer o que precisa da sua atenção hoje. No espaço Hoje, a proposta é aproximar prioridades e próximos passos, sem perder de vista a trajetória maior. Você não precisa resolver o futuro inteiro para começar a construir alguma coisa.', image:asset('home-detail.webp'), cover:asset('home-detail.webp'), gallery:[asset('home.webp')], href:'/modulos/hoje/' },
  { id:'direcao', slug:'direcao', title:'Direção', name:'Direção', category:'UM CAMINHO QUE É SEU', role:'UM CAMINHO QUE É SEU', summary:'Não existe uma única forma de construir uma trajetória.', body:'Direção é dar contexto às escolhas. Visão, Currículo Studio, Instituições, Comparar, Residência, Internacional e Meu Caminho olham a formação por ângulos diferentes. Juntos, ajudam a transformar experiências e interesses em uma rota que pode ser revista.', image:asset('vision-detail.webp'), cover:asset('vision-detail.webp'), gallery:[asset('vision.webp'),asset('path-detail.webp')], href:'/modulos/trajetoria/' },
  { id:'descoberta', slug:'descoberta', title:'Descoberta', name:'Descoberta', category:'AMPLIAR AS POSSIBILIDADES', role:'AMPLIAR AS POSSIBILIDADES', summary:'Às vezes, o próximo caminho começa com uma possibilidade nova.', body:'Descoberta é ampliar o repertório sem perder o contexto. Explorar reúne oportunidades, editais, instituições e congressos para apoiar uma busca intencional. Encontrar é o começo; conferir a fonte e entender o que faz sentido para você também faz parte do processo.', image:asset('explore-detail.webp'), cover:asset('explore-detail.webp'), gallery:[asset('explore.webp')], href:'/modulos/explorar/' },
  { id:'metodo', slug:'metodo', title:'Método', name:'Método', category:'DA PERGUNTA AO PROJETO', role:'DA PERGUNTA AO PROJETO', summary:'Uma pesquisa cresce quando a curiosidade encontra uma estrutura.', body:'Método é manter o raciocínio visível. O ambiente de pesquisa da THE MED organiza 15 etapas com um ciclo de Entender, Aplicar, Validar e Entregar. O apoio digital não elimina a orientação, a crítica nem a responsabilidade de quem pesquisa.', image:asset('research-detail.webp'), cover:asset('research-detail.webp'), gallery:[asset('pesquisa-ferramentas.png'),asset('research.webp')], href:'/modulos/pesquisa/' },
  { id:'troca', slug:'troca', title:'Troca', name:'Troca', category:'FORMAÇÃO EM COMUNIDADE', role:'FORMAÇÃO EM COMUNIDADE', summary:'Há aprendizados que só acontecem quando fazemos juntos.', body:'Troca é reconhecer o valor da participação. Nas ligas, o encontro entre interesses pode se transformar em atividades e projetos. A THE MED propõe um espaço para descobrir, compreender e acompanhar essa experiência coletiva.', image:asset('ligas-detail.webp'), cover:asset('ligas-detail.webp'), gallery:[asset('ligas-inicio.png'),asset('ligas-projeto.png')], href:'/modulos/ligas/' },
  { id:'presenca', slug:'presenca', title:'Presença', name:'Presença', category:'TEMPO PARA OLHAR JUNTO', role:'TEMPO PARA OLHAR JUNTO', summary:'Avançar também pode significar parar para conversar.', body:'Presença é abrir espaço para dúvidas, revisões e escolhas. O Mentor IA é um assistente de inteligência artificial para conversar sobre a trajetória; a proposta Ultra acrescenta acompanhamento humano por mensagens, revisões e uma sessão mensal de 45 minutos. São papéis distintos, pensados para se complementar.', image:asset('mentor-detail.webp'), cover:asset('mentor-detail.webp'), gallery:[asset('mentor.webp'),asset('acompanhamento.png')], href:'/modulos/mentor/' }
];

export const editorial = {
  slug:'comunidade', kicker:'THE MED / EM COMUM', title:'O conhecimento cresce no encontro.',
  intro:'Uma pergunta pode começar sozinha. O caminho para desenvolvê-la quase nunca é. A THE MED nasce da ideia de aproximar trajetória, pesquisa e comunidade — sem apagar as diferenças de cada percurso.',
  summary:'Uma narrativa sobre o que conecta a formação médica: curiosidade, método, participação e presença.',
  cover:asset('ligas-projeto.png'), image:asset('ligas-projeto.png'),
  sections: [
    section('01 / PERSPECTIVAS', 'Conhecimento cresce quando encontra outras perspectivas.', 'Uma formação acontece em muitos lugares: na graduação, em uma leitura, em um projeto e em uma conversa. Aproximar essas experiências amplia a forma de olhar para uma pergunta. A THE MED propõe esse encontro entre trajetória, pesquisa e comunidade, sem definir um único caminho ideal.', 'vision.webp'),
    section('02 / CONTEXTO', 'Uma possibilidade precisa fazer sentido para você.', 'Encontrar uma oportunidade é apenas o começo. É preciso olhar para o seu momento, entender requisitos e confirmar as informações nas fontes oficiais. Explorar e comparar são formas de ampliar a escolha com responsabilidade — não garantias de elegibilidade, vaga ou resultado.', 'explore.webp'),
    section('03 / MÉTODO', 'Pesquisa é um processo, não um salto.', 'O ambiente de pesquisa organiza uma jornada de 15 etapas. Dentro delas, Entender, Aplicar, Validar e Entregar são movimentos recorrentes que conectam conceito, trabalho, revisão e resultado. A plataforma apoia a organização, sem substituir o orientador, a instituição ou as avaliações éticas aplicáveis.', 'research-detail.webp'),
    section('04 / PARTICIPAÇÃO', 'A experiência vale pelo que se constrói.', 'Uma liga é mais do que um nome no currículo. Participar significa encontrar interesses em comum, acompanhar atividades e contribuir para um trabalho coletivo. Registrar essa experiência ajuda a reconhecer o que foi vivido — com atenção à diferença entre declarar e comprovar.', 'ligas-inicio.png'),
    section('05 / PRESENÇA', 'Tecnologia e companhia têm papéis diferentes.', 'O Mentor IA é um assistente de inteligência artificial para organizar dúvidas e trabalhar possibilidades da trajetória. O Ultra propõe acompanhamento humano por mensagens, revisões e uma sessão mensal de 45 minutos. Um não se apresenta como o outro: contexto digital e conversa humana são contribuições distintas.', 'acompanhamento.png')
  ],
  gallery: ['home-detail.webp','vision-detail.webp','research-detail.webp','ligas-detail.webp','mentor-detail.webp','acervo.png','cv-detail.webp','path-detail.webp','explore-detail.webp','ligas-projeto.png','internacional-detail.webp','club-detail.webp'].map(asset),
  cta:'Conhecer os espaços da THE MED', href:'/#works'
};

export const mosaicImages = editorial.gallery;
export const tour = { src:asset('innecta-tour.mp4'), poster:asset('home.webp'), title:'Por dentro da THE MED', description:'Um percurso visual pelas interfaces de demonstração da plataforma.' };

/** Two editorial product perspectives, mirroring the source directory's two records. */
export const directoryProfiles = [
  {
    id:'trajetoria-academica', slug:'trajetoria-academica', title:'Trajetória acadêmica', name:'Trajetória acadêmica',
    category:'UMA FORMAÇÃO, MUITAS POSSIBILIDADES', role:'UMA FORMAÇÃO, MUITAS POSSIBILIDADES',
    summary:'Uma trajetória não é uma linha reta. É a relação entre o que você já construiu, o que deseja explorar e as escolhas que faz pelo caminho.',
    body:'A THE MED reúne perspectivas que costumam ficar dispersas: objetivos, currículo, instituições, residência, experiências internacionais e próximos passos. Esse percurso editorial apresenta como elas podem conversar, sem prometer uma rota única ou um resultado acadêmico.',
    image:asset('vision-detail.webp'), cover:asset('vision-detail.webp'), href:'/modulos/trajetoria/',
    gallery:['vision.webp','cv.webp','cv-detail.webp','instituicoes-detail.webp','trajetoria-comparar.png','residencia-detail.webp','internacional-detail.webp','path.webp'].map(asset),
    bodyBlocks:[
      {type:'p',text:'A pergunta “aonde você quer chegar?” pode parecer grande demais quando o presente já exige tanto. Talvez o começo seja reconhecer o que existe agora: interesses, experiências, dúvidas e tempo. A trajetória passa a fazer sentido quando essas peças deixam de ser vistas isoladamente.'},
      {type:'quote',text:'Não existe um caminho ideal para todo mundo. Existe um caminho que precisa fazer sentido para você.'},
      {type:'p',text:'Visão oferece um lugar para olhar o conjunto. Não se trata de prever o futuro, mas de aproximar objetivos e possibilidades. O que parece uma escolha pequena pode ganhar outro significado quando visto no contexto da formação.'},
      {type:'image',src:asset('vision.webp'),alt:'Visão da trajetória na interface de demonstração da THE MED.'},
      {type:'p',text:'O currículo conta parte dessa história. Reunir atividades, registrar experiências e organizar comprovações ajuda a perceber o que foi construído. No Currículo Studio, a apresentação pode ser trabalhada com atenção ao contexto, sem transformar uma experiência declarada em comprovação automática.'},
      {type:'image',src:asset('cv-detail.webp'),alt:'Currículo Studio em demonstração, com uma apresentação curricular ilustrativa.'},
      {type:'p',text:'Instituições e oportunidades ampliam o repertório de escolhas. Uma referência pode ser acompanhada, estudada e comparada com outras. Estar presente em uma tela de demonstração não significa que uma instituição seja parceira da THE MED, nem que uma oportunidade esteja disponível.'},
      {type:'p',text:'Comparar é dar atenção às diferenças. Horizonte, dedicação e relação com o objetivo ajudam a pensar sobre um caminho. Requisitos e condições precisam ser confirmados nas fontes oficiais: uma comparação é apoio à decisão, não uma decisão no seu lugar.'},
      {type:'quote',text:'O plano pode mudar. O contexto que você constrói continua sendo valioso.'},
      {type:'image',src:asset('path-detail.webp'),alt:'Meu Caminho apresenta horizontes e próximos passos em uma interface de demonstração.'},
      {type:'p',text:'Residência e Internacional convidam a olhar para horizontes diferentes. Cada processo tem regras próprias. A proposta da THE MED é ajudar a organizar a preparação e a leitura desses caminhos, preservando a responsabilidade das instituições e de quem faz a escolha.'},
      {type:'video',src:asset('innecta-tour.mp4'),poster:asset('home.webp'),alt:'Percurso visual silencioso pelas interfaces de demonstração da THE MED.'},
      {type:'p',text:'Meu Caminho aproxima esses horizontes da semana real. Uma ação pequena pode ser o que permite continuar: revisar um currículo, conferir um prazo, conversar sobre uma dúvida. Hoje, Explorar, Pesquisa, Ligas e Mentor IA alimentam esse processo com perspectivas diferentes. O acompanhamento humano Ultra é um espaço separado de mensagens, revisões e sessão mensal de 45 minutos.'},
      {type:'p',text:'Este é um percurso editorial do produto, não o relato de uma pessoa ou uma promessa de resultado. A THE MED está em preparação. As imagens mostram interfaces de demonstração; nomes, números, instituições e atividades ilustrados não representam clientes, resultados ou parcerias anunciadas.'}
    ]
  },
  {
    id:'pesquisa-em-movimento', slug:'pesquisa-em-movimento', title:'Pesquisa em movimento', name:'Pesquisa em movimento',
    category:'CURIOSIDADE QUE ENCONTRA MÉTODO', role:'CURIOSIDADE QUE ENCONTRA MÉTODO',
    summary:'Uma boa pergunta abre o caminho. Método, revisão e continuidade ajudam a transformar curiosidade em um projeto que ganha forma.',
    body:'O ambiente de Pesquisa da THE MED organiza uma jornada de 15 etapas. Dentro delas, o ciclo Entender, Aplicar, Validar e Entregar mantém visível a ligação entre aprender, construir, revisar e registrar — sem substituir orientação ou avaliação ética.',
    image:asset('research-detail.webp'), cover:asset('research-detail.webp'), href:'/modulos/pesquisa/',
    gallery:['pesquisa-painel.png','pesquisa-tendencias.png','pesquisa-manual.png','pesquisa-ferramentas.png','pesquisa-projetos.png','research.webp','research-detail.webp','acervo.png','mentor-detail.webp'].map(asset),
    bodyBlocks:[
      {type:'p',text:'Às vezes, uma pesquisa começa com algo que não se encaixa: uma observação, uma leitura, uma dúvida que continua voltando. Esse interesse ainda não é um projeto. Mas pode ser um ponto de partida quando encontra tempo, orientação e uma forma de ser trabalhado.'},
      {type:'quote',text:'A curiosidade abre uma porta. O método ajuda a atravessá-la com responsabilidade.'},
      {type:'image',src:asset('pesquisa-painel.png'),alt:'Painel de Pesquisa da THE MED em demonstração.'},
      {type:'p',text:'Na THE MED, Entender, Aplicar, Validar e Entregar são movimentos recorrentes dentro do trabalho. Eles não substituem a jornada de pesquisa por apenas quatro fases: ajudam a organizar a relação entre conceito, prática, revisão e resultado em cada etapa.'},
      {type:'p',text:'A jornada do projeto tem 15 etapas. O manual é um recurso de apoio à leitura e ao aprendizado, não uma contagem equivalente de etapas. Separar essas estruturas evita confundir o conteúdo que você consulta com o processo que está construindo.'},
      {type:'image',src:asset('pesquisa-ferramentas.png'),alt:'Ferramentas de pesquisa com campos de uma pergunta científica ilustrativa.'},
      {type:'p',text:'Entender vem antes de preencher. Uma pergunta de pesquisa exige reconhecer o que está sendo investigado e por que isso importa. O manual e as referências oferecem contexto para que os conceitos não sejam apenas palavras em um formulário.'},
      {type:'p',text:'Aplicar é colocar esse raciocínio em trabalho. As ferramentas aproximam os componentes do projeto e permitem desenvolver uma ideia de modo mais organizado. Não é a existência de um campo preenchido que garante a qualidade da decisão: o raciocínio precisa continuar visível.'},
      {type:'quote',text:'Um projeto não avança apenas quando se escreve mais. Ele também avança quando uma escolha é revista.'},
      {type:'image',src:asset('research-detail.webp'),alt:'Projeto de pesquisa demonstrativo com o ciclo Entender, Aplicar, Validar e Entregar.'},
      {type:'p',text:'Validar é olhar criticamente para o que foi feito. Verificações explícitas podem revelar uma lacuna, uma dúvida ou algo que precisa ser discutido com quem orienta. Na plataforma, essa revisão não representa uma aprovação científica automática.'},
      {type:'p',text:'A responsabilidade acadêmica permanece com as pessoas e instituições envolvidas. A THE MED não substitui o orientador, as normas institucionais ou as instâncias de avaliação ética aplicáveis. Um ambiente organizado apoia o processo; não elimina seus compromissos.'},
      {type:'video',src:asset('innecta-tour.mp4'),poster:asset('research.webp'),alt:'Tour silencioso de interfaces de demonstração da THE MED.'},
      {type:'p',text:'Entregar é deixar um resultado que possa ser retomado. Quando uma etapa registra o que foi construído, o trabalho ganha continuidade. Isso ajuda a não depender apenas da memória ou de arquivos desconectados para entender o ponto em que o projeto está.'},
      {type:'image',src:asset('pesquisa-projetos.png'),alt:'Projetos científicos ilustrativos no ambiente de demonstração da THE MED.'},
      {type:'p',text:'Continuar também exige reconhecer limites de tempo e atenção. A jornada de 15 etapas mantém o processo dividido em partes, mas preserva o fio entre elas. A próxima ação faz mais sentido quando você consegue enxergar o que a precede e o que ela prepara.'},
      {type:'p',text:'Pesquisa conversa com outros espaços da formação. Uma liga pode aproximar interesses, o Acervo pode apoiar uma leitura e uma conversa pode ajudar a formular uma dúvida. O Mentor IA é um assistente de inteligência artificial; o acompanhamento humano Ultra tem um papel distinto de mensagens, revisões e uma sessão mensal de 45 minutos.'},
      {type:'quote',text:'O objetivo não é pular as partes difíceis da pesquisa. É torná-las mais compreensíveis e trabalháveis.'},
      {type:'p',text:'Este percurso apresenta a perspectiva editorial e os recursos do produto em preparação. Não é um estudo publicado, um depoimento de pesquisador ou uma garantia de aprovação. Pessoas, contagens e projetos nas telas são exemplos de demonstração.'}
    ]
  }
];
