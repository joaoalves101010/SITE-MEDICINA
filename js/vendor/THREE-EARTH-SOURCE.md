# Three.js usado exclusivamente pela página 404

Arquivo `three-earth.js`: distribuição oficial completa ES module de **three 0.131.3**, obtida em https://cdn.jsdelivr.net/npm/three@0.131.3/build/three.module.js . Licença MIT: `THREE-LICENSE.txt`.

O runtime seletivo `three-scene.js` já existente não exporta TextureLoader. A nova página usa esta cópia independente com versão fixa, sem modificar as cenas ou os vendors das demais rotas. Nenhum CDN é consultado em execução.

Única alteração local na distribuição: remoção de um espaço antes de tabulação na indentação da linha `material = getMaterial( data.material );`, sem alteração de código.
