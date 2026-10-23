/**
 * Three editorial, code-native diagrams. All geometry and labels are visible before
 * enhancement; CSS adds only a finite line reveal to the existing in-view state.
 */
const diagrams = [
  {
    name: 'connections',
    title: 'Contexto para o seu caminho',
    description: 'Currículo, objetivo e oportunidades se conectam para orientar o seu caminho.',
    drawing: `
      <g class="pv-labels">
        <text x="12" y="62">Currículo</text>
        <text x="12" y="142">Objetivo</text>
        <text x="12" y="222">Oportunidades</text>
      </g>
      <g class="pv-rules">
        <path d="M12 74H122M12 154H122M12 234H122"/>
      </g>
      <g class="pv-flow pv-flow--inputs">
        <path class="pv-draw pv-draw--a" pathLength="1" d="M122 74C174 74 166 154 220 154"/>
        <path class="pv-draw pv-draw--b" pathLength="1" d="M122 154H220"/>
        <path class="pv-draw pv-draw--c" pathLength="1" d="M122 234C174 234 166 154 220 154"/>
      </g>
      <path class="pv-flow pv-flow--output pv-draw pv-draw--d" pathLength="1" d="M220 154H347M340 148L347 154L340 160"/>
      <text class="pv-emphasis" x="226" y="134">Seu caminho</text>
      <text class="pv-note" x="226" y="181">com contexto</text>
      <path class="pv-register" d="M12 270H37"/>
      <text class="pv-caption" x="47" y="275">Conexões que orientam.</text>`
  },
  {
    name: 'research',
    title: 'O ciclo de trabalho da pesquisa',
    description: 'Entender, Aplicar, Validar e Entregar organizam o trabalho de pesquisa.',
    drawing: `
      <text class="pv-caption" x="12" y="32">Ciclo de trabalho em pesquisa</text>
      <path class="pv-research-guide" d="M12 235L346 67"/>
      <path class="pv-flow pv-flow--stair pv-draw" pathLength="1" d="M12 242H94V192H176V142H258V92H347M340 86L347 92L340 98"/>
      <g class="pv-step-labels">
        <text x="12" y="221">Entender</text>
        <text x="94" y="171">Aplicar</text>
        <text x="176" y="121">Validar</text>
        <text x="258" y="71">Entregar</text>
      </g>
      <g class="pv-step-ticks">
        <path d="M12 237V247M94 187V197M176 137V147M258 87V97"/>
      </g>
      <text class="pv-note" x="12" y="278">Compreender. Fazer. Rever. Avançar.</text>`
  },
  {
    name: 'support',
    title: 'Mentor IA e Ultra: papéis complementares',
    description: 'Duas linhas distintas: Mentor IA, inteligência artificial; Ultra, acompanhamento humano. Os dois papéis se orientam para a sua trajetória sem se confundir.',
    drawing: `
      <text class="pv-lane-title" x="12" y="59">Mentor IA</text>
      <text class="pv-lane-description" x="12" y="85">Inteligência artificial</text>
      <path class="pv-flow pv-flow--lane-a pv-draw pv-draw--a" pathLength="1" d="M12 104H213C248 104 242 151 274 151H347M340 145L347 151L340 157"/>
      <text class="pv-lane-title pv-lane-title--human" x="12" y="199">Ultra</text>
      <text class="pv-lane-description" x="12" y="225">Acompanhamento humano</text>
      <path class="pv-flow pv-flow--lane-b pv-draw pv-draw--b" pathLength="1" d="M12 244H213C248 244 242 171 274 171H347M340 165L347 171L340 177"/>
      <text class="pv-shared-direction" x="274" y="128">Você</text>
      <text class="pv-caption" x="12" y="284">Papéis diferentes. Apoio complementar.</text>`
  }
];

export function renderPrincipleVisual(index) {
  const diagram = diagrams[index];
  if (!diagram) throw new RangeError('Unknown Innecta principle visual');
  const id = `principle-visual-${index}`;
  return `<figure class="principle-art principle-diagram principle-diagram--${diagram.name}" data-principle-visual="${index}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" width="360" height="300" role="img" aria-labelledby="${id}-title ${id}-description" focusable="false"><title id="${id}-title">${diagram.title}</title><desc id="${id}-description">${diagram.description}</desc>${diagram.drawing}</svg></figure>`;
}
