# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Adultos que treinam (ginásio, corrida, desporto amador) ou que querem simplesmente comer mais proteína, em Portugal (português de Portugal, por tu) e, desde 5/11/2026, em inglês. Abrem a app no telemóvel ao longo do dia (ao planear, ao fazer compras, à mesa) e no computador para preparar a semana. Não querem fazer dieta nem contar calorias: querem saber se o dia que já comem chega à meta e o que juntar quando falta pouco.

Segunda audiência (portefólio): recrutadores e equipas técnicas que avaliam o trabalho do Bernardo em JS/React/Next.js; como a app pede login, só veem as páginas públicas (início, alimentos, detalhe, entrar).

## Product Purpose

Mostrar que atingir a meta diária de proteína é fácil com comida de verdade. A pessoa entra (Google ou Apple), responde a um formulário curto (meta, refeições e treino, restrições, alimentos de que gosta, cozinha), vê um dia completo com os seus alimentos que já atinge a meta, ajusta porções reais e gera receitas por IA feitas para ela. Sucesso: chegar a um dia que atinge a meta em menos de 2 minutos depois de entrar, e voltar no dia seguinte.

## Positioning

"Protein without the diet": a meta chega-se com comida de verdade, em porções que se reconhecem (2 ovos, 1 iogurte), não com suplementos, pesos ao grama ou culpa. A proteína é sempre calculada pela app a partir de 168 alimentos com valores de referência (nunca pelo modelo de IA); o dia exemplo é determinístico e só usa o que a pessoa pode e gosta de comer.

## Operating Context

- Páginas públicas: início (o dia exemplo de 160 g e o prato 3D), catálogo `/alimentos` com 147 alimentos e o detalhe de cada um (porções, proteína, "Ver em 3D"), `/entrar`, privacidade e termos.
- App (com login): formulário de boas-vindas em 6 passos, "O meu dia" (refeições pela ordem do dia, stepper de meia porção, "Para fechar a meta", prato 3D), receitas por IA (uma receita ou o dia todo, livro de receitas guardadas), conta (preferências, exportar, apagar).
- Usada sobretudo no telemóvel; no desktop ocupa o ecrã todo (colunas, painéis laterais fixos).
- Next.js 16 em Cloudflare Workers; páginas públicas estáticas; Lighthouse CI (semanal contra o staging, ou à mão) falha abaixo de 90 em mobile.

## Capabilities and Constraints

- A proteína vem sempre da app (`content/foods`), nunca da IA. Calorias só como informação, desligadas por defeito.
- Dados de saúde (peso, alergias) só com consentimento; nunca em logs nem na IA.
- Páginas públicas sem a biblioteca `motion` (CSS) e o texto do hero é o LCP; o three (≈253 KB gzip) só chega depois do LCP no desktop, depois de um clique no detalhe, ou ao abrir o bloco no telemóvel. Velocidade primeiro: Lighthouse ≥ 90 nas quatro categorias em mobile mantém-se (decisão de 6/11/2026).
- CSP restrita (sem WebAssembly, fontes e scripts só do próprio domínio).
- Português sem prefixo e inglês em `/en`; todo o texto em `src/messages/pt.json` e `en.json`.
- Modelos 3D: Kenney Food Kit (CC0); ilustrações: Fluent Emoji 3D (MIT).

## Brand Commitments

- Nome "Protein Plate" e frase "Proteína sem dieta." / "Protein without the diet." (confirmado a 6/11/2026).
- Logótipo do anel (anel verde com um quarto amarelo, `public/icon.svg`).
- Cores atuais (claro / escuro): `--bg` #FBF8F3 / #12110F, `--surface` #FFFFFF / #1C1A17, `--text` #1F1B16 / #F3EEE7, `--text-muted` #6B6258 / #A99F93, `--primary` #2F6B3A / #6FBF7A, `--accent` #F2B33D / #F5C25E (só fundo), `--track` #EAE3D8 / #2A2723, `--danger` só para erros técnicos.
- Letra atual: Bricolage Grotesque (títulos e números) e Figtree (texto); o número de proteína grande e tabular é a assinatura.
- Tom: tu, frases curtas, zero culpa, sempre o próximo passo ("Faltam 23 g. Um skyr resolve."). Nunca vermelho nem "falhaste" ligados à nutrição.

## Evidence on Hand

- O dia exemplo real de 160 g (4 refeições, 171 g) gerado pelo domínio, 168 alimentos com porções e proteína, 56 modelos 3D otimizados (`public/models`), ilustrações Fluent Emoji (`public/images`), imagens Open Graph (`public/og`).
- Não há testemunhos, número de utilizadores, imprensa nem avaliações: não inventar nenhum.

## Product Principles

1. Comida de verdade primeiro: mostrar alimentos e porções que as pessoas reconhecem, não macros.
2. Zero culpa: a falta é "faltam X g" e uma sugestão, nunca um erro.
3. A app calcula, a IA cozinha: os números nunca vêm do modelo.
4. Rápido no telemóvel: o essencial lê-se e usa-se sem esperar pelo 3D.
5. O HTML é a fonte de verdade: o 3D e o movimento ilustram, nunca são a única forma de ler a informação.

## Accessibility & Inclusion

WCAG 2.2 AA: contraste ≥ 4,5:1, alvos ≥ 44 px, foco visível, teclado em tudo, `aria-live` para "Faltam X g", `prefers-reduced-motion` respeitado em todo o movimento (CSS, motion e 3D), canvas 3D decorativo (`aria-hidden`). axe sem violações em claro e escuro.
