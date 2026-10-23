# Innecta — experiência imersiva

Landing page editorial da Innecta para a formação acadêmica e a trajetória de estudantes de medicina. Projeto estático completo, em português, com animações progressivas, páginas de módulos, comunidade e percursos.

**Comece por [CONTEXTO_PROJETO.md](CONTEXTO_PROJETO.md)** para entender o objetivo, as decisões aprovadas, a ordem atual das seções, os comportamentos e os cuidados de continuidade.

## Executar

Requisitos: **Node.js 22 ou superior**, npm e Python 3 para o servidor local. Não há dependências npm para instalar: as bibliotecas de execução estão incluídas localmente.

```sh
npm run build   # gera/recria dist/
npm run check   # valida sintaxe JavaScript
npm test        # testes de conteúdo, rotas, recursos, animação e ciclo de vida
npm run serve   # abre servidor em http://localhost:4173
```

Abra o endereço do servidor, não os arquivos por `file://`. O `dist/` já acompanha esta exportação, mas deve ser reconstruído depois de editar o código. O script de build **substitui integralmente** esse diretório.

## Publicar

- Diretório público: **`dist`**.
- Comando de build: **`npm run build`**.
- Hospede os arquivos na **raiz do domínio**, com caminhos como `/assets/...` e `/modulos/trajetoria/`.
- Cada rota possui `index.html` físico; não é necessário roteador SPA ou rewrite geral. Use `404.html` como página de erro.
- Este pacote não configura nem afirma ativar GitHub Pages, domínio, autenticação ou qualquer serviço de hospedagem.
- **Atenção ao GitHub Pages de repositório:** publicar diretamente em `/SITE-MEDICINA/` não é equivalente a uma publicação na raiz. Os caminhos absolutos precisarão de uma adaptação de base antes desse modo de uso; alternativamente, use domínio próprio/host com raiz apropriada. Não basta copiar `dist` para uma subpasta e presumir compatibilidade.

## Estrutura

- `js/`: componentes, conteúdo, controladores, renderizadores e testes de unidade.
- `css/`: estilos e responsividade.
- `assets/`: imagens, ilustrações originais, fontes, vídeo e créditos.
- `tests/`: regressões, conteúdo e integridade de escopo.
- `scripts/` e `tools/globe-source/`: regeneração opcional da geografia do globo.
- `build.mjs`: geração das 11 rotas físicas e do `404.html`.
- `dist/`: resultado publicável.
- `EXPORT_MANIFEST.json`: inventário com tamanho e SHA-256 dos arquivos exportados.

## Limites importantes

É uma **LP estática independente**, não o sistema autenticado da Innecta. Não inclui backend, banco, login, cobrança, checkout ou integração Asaas. O projeto Enter permanece separado. Os links externos do produto e das instituições são navegação, não integrações ou parcerias.

WebGL é aprimoramento visual, não requisito para ler o conteúdo. Há alternativas DOM/CSS, modo de movimento reduzido e saídas acessíveis da galeria. `?galleryDiagnostic=1` abre um painel local opcional de diagnóstico; não envia telemetria. A aparência real de todos os efeitos na GPU de um dispositivo precisa de validação nesse dispositivo.

## Fontes e direitos

Leia **[FONTES_E_LICENCAS.md](FONTES_E_LICENCAS.md)** antes de redistribuir/publicar comercialmente. Os créditos individuais das fotografias devem ser mantidos. A presença dos arquivos **Roobert** e dos efeitos derivados de referências não estabelece autorização geral de redistribuição. Este pacote não aplica uma licença única que substitua direitos de terceiros.

Documentação complementar: [IMPLEMENTATION.md](IMPLEMENTATION.md), [BOOK-IMPLEMENTATION.md](BOOK-IMPLEMENTATION.md), [SCIENCE-SOURCES.md](SCIENCE-SOURCES.md) e [MEDICAL-EXPERIENCES-SOURCES.md](MEDICAL-EXPERIENCES-SOURCES.md).
