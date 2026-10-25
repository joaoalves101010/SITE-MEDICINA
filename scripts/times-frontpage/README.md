# Capa editorial da edição 004

Composição original para a prévia da landing page, a partir de nove registros reais da edição 004, de 25/10/2026. Não é uma reprodução de texto, fotografia ou marca do jornal usado como referência visual. Não é screenshot nem geração de imagem por IA.

## Reproduzir

```sh
python scripts/times-frontpage/render.py
npm run build
npm test
```

O gerador usa Python, Pillow e FontTools; não faz parte do build Node normal. O SVG já versionado não exige essas dependências em produção. Para uma prova PNG opcional, sem navegador:

```sh
inkscape assets/the-med-times-frontpage-004.svg --export-type=png --export-filename=/tmp/frontpage-004.png --export-width=1600
```

`edition-004.json` preserva os nove artigos completos da seleção. As partes exibidas são títulos, subtítulos, parágrafos inteiros e implicações editoriais literais. `layout-proof.json` registra cada bloco e seu retângulo; `SOURCE-MANIFEST.json` registra hashes dos dados, fontes e fotografias copiados da edição aprovada. O gerador não atualiza a edição nem consulta feeds. Uma troca de edição exige nova seleção e revisão, além da data externa correspondente.

## Tipografia e licenças

O bundle de geração usa **Liberation Serif/Sans 2.1.5**, sob **SIL Open Font License 1.1**. A versão e a licença foram conferidas nos metadados dos cinco TTFs; o aviso original completo acompanha os arquivos em `fonts/FONT-LICENSE.txt`. Fontes originais, não modificadas, copiadas do pacote instalado `fonts-liberation`.

Fonte oficial e licença: <https://github.com/liberationfonts/liberation-fonts> e <https://github.com/liberationfonts/liberation-fonts/blob/main/LICENSE>. A OFL autoriza uso, incorporação e redistribuição com os avisos aplicáveis e distingue o software de fontes dos documentos criados com ele: estes não precisam adotar OFL por utilizarem as fontes. Os nomes reservados e créditos permanecem preservados. Esta escolha é restrita aos contornos da prévia; o site principal e o jornal mantêm suas próprias fontes.

Os caracteres da prévia são contornos vetoriais reutilizados, medidos a partir dos mesmos arquivos de fonte. O navegador não recebe solicitações de webfont nem usa fonte de fallback para essa imagem.

## Fotografias reais

- **Harvard Medical School**, 2008: SA (Drsamir), Wikimedia Commons, domínio público. Origem: <https://commons.wikimedia.org/wiki/File:Hms.jpg>.
- **Aedes aegypti**, 2022: CDC / Amy E. Lockwood, MS, PHIL 26041, domínio público. Fonte gratuita: <https://wwwn.cdc.gov/phil/Details.aspx?pid=26041>. O uso desta imagem não implica endosso do CDC, HHS ou governo dos Estados Unidos ao THE MED TIMES.

Ambas mantêm o enquadramento integral. O único processamento é redimensionamento proporcional e codificação JPEG para incorporação ao SVG. `PHOTOGRAPH-CREDITS.json` preserva os metadados aprovados. A página oferece o aviso CDC em texto legível e o arquivo `assets/the-med-times-frontpage-004-credits.txt` pelo link “Créditos da prévia”.

## Limites de verificação

Inspeção do PNG verifica a composição do SVG; não valida o layout do browser. As provas de largura são rasterizações de 279/340/497 px, correspondentes matematicamente às áreas da capa em viewports de 320/390/1440 px. Não são screenshots. A imagem usa largura 100%, altura automática, razão 1000:1480 e `object-fit: contain`; a data, o destino para leitura completa e os créditos permanecem em HTML acessível.
