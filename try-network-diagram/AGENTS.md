# AGENTS.md

## Projeto

Este projeto implementa um diagrama de redes interativo para visualizacao de fluxos operacionais de um ISP.

O foco atual e representar:
- provisionamento de ONT Huawei
- provisionamento de ONU em bridge
- DHCP da WAN TR069
- autenticacao PPPoE em ONT
- autenticacao PPPoE em ONU bridge com roteador residencial
- comunicacao da ONT com o ambiente ACS/TR069
- diagrama fisico completo da rede principal

A aplicacao foi pensada para evoluir com novos diagramas sem reescrever a interface.

## Stack

- Vite
- React
- TypeScript
- CSS puro
- SVG para renderizacao do diagrama

## Comandos

Instalacao:
- `npm install`

Desenvolvimento:
- `npm run dev`

Build:
- `npm run build`

Preview:
- `npm run preview`

Fluxo completo:
- `npm run start:full`

Observacoes:
- `start:full` executa `npm install`, `npm run build` e `npm run dev` em sequencia
- `npm run dev` permanece em execucao

## Estrutura Principal

- `src/App.tsx`
  Controla layout geral da aplicacao e fluxo selecionado.

- `src/data/network.ts`
  Fonte principal dos dados do diagrama:
  - devices
  - links
  - flows

- `src/types.ts`
  Tipos de dados do dominio do diagrama.

- `src/components/NetworkDiagram.tsx`
  Renderizacao SVG do diagrama, zoom, pan e zonas visuais.

- `src/components/DeviceIcon.tsx`
  SVGs customizados dos equipamentos.

- `src/components/FlowSelector.tsx`
  Lista lateral de tipos de comunicacao.

- `src/components/FlowDetails.tsx`
  Painel lateral com detalhes tecnicos.

- `src/components/Legend.tsx`
  Legenda visual do diagrama.

- `src/index.css`
  Estilos globais e visuais do diagrama.

## Modelo de Dados

### Device

Cada equipamento da rede e modelado como `Device`.

Campos relevantes:
- `id`
- `name`
- `shortName`
- `role`
- `type`
- `zone`
- `x`, `y`, `width`, `height`

### Link

Cada ligacao entre equipamentos e modelada como `Link`.

Campos relevantes:
- `id`
- `from`
- `to`
- `points`
- `label`
- `labelX`
- `labelY`
- `labelAnchor`

Observacao:
- o modelo ainda possui alguns campos legados de `l3`, mantidos por compatibilidade com iteracoes anteriores

### Flow

Cada diagrama selecionavel e modelado como `Flow`.

Campos relevantes:
- `id`
- `name`
- `category`
- `tone`
- `source`
- `destination`
- `layer`
- `summary`
- `details`
- `zones`
- `activeDevices`
- `activeLinks`
- `packetLabel`
- `path`

## Regras Atuais de UX

### Diagrama

- o diagrama mostra apenas os devices e links do fluxo selecionado
- a area central deve ser a prioridade visual da pagina
- o diagrama suporta:
  - zoom in
  - zoom out
  - reset de zoom
  - pan com botao esquerdo do mouse

### Zonas visuais

As zonas atuais sao:
- `provisionamento`
- `transporte`
- `servidores`

As zonas devem:
- acompanhar apenas os devices visiveis do fluxo
- nunca se sobrepor
- manter espacamento minimo entre si

### Tipografia

- deve permanecer compacta
- o visual deve parecer ferramenta operacional, nao landing page

### Visual

- manter linguagem de diagrama tecnico
- evitar refatoracoes visuais grandes sem validar incrementalmente
- priorizar legibilidade sobre efeitos visuais

## Regras Para Adicionar Novos Fluxos

Ao adicionar um novo fluxo em `src/data/network.ts`:

1. Definir `name`, `category`, `summary` e `details`
2. Escolher `zones` corretas
3. Listar `activeDevices`
4. Listar `activeLinks`
5. Definir `packetLabel`
6. Definir `path`
7. Validar labels e coordenadas no SVG
8. Rodar build

Checklist:
- o fluxo aparece no menu lateral
- o diagrama nao corta equipamentos
- labels nao se sobrepoem
- zonas nao colidem
- zoom e pan continuam funcionando

## Regras Para Editar Layout

Antes de alterar coordenadas:

1. manter a malha visual coerente entre os fluxos
2. evitar ajustes isolados que desalinhem os demais diagramas
3. revisar:
   - devices
   - links
   - labels
   - zonas
   - path animado

Se a mudanca for grande:

1. preferir ajustar a malha base
2. depois recalibrar os flows
3. evitar remendos visuais pontuais

## Cuidados Importantes

- nao remover o script `start:full` sem necessidade
- evitar dependencias visuais novas sem justificativa forte
- nao representar VMs isoladas no diagrama fisico completo
- no diagrama fisico completo, mostrar apenas infraestrutura principal
- preservar o host de virtualizacao como representacao fisica do ambiente de servidores

## Diagrama Fisico Completo

O fluxo `core-fisico-completo` deve mostrar apenas:
- `OLT_XPTO_01`
- `COTIA_DIST_SW_02`
- `COTIA_CORE_SW_01`
- `COTIA_CORE_BRAS_01`
- `COTIA_CORE_BRAS_02`
- `COTIA_DIST_SW_01`
- `Servidor de Virtualizacao / Proxmox`

Nao incluir:
- CPEs
- ONT
- ONU
- sistemas como IXC
- VMs isoladas

## Pendencias Tecnicas Relevantes

Melhorias futuras recomendadas:
- simplificar o modelo removendo campos legados de `l3` se nao forem mais usados
- separar melhor layout dos diagramas de comunicacao e do diagrama fisico completo
- revisar pan/zoom para experiencia mais robusta
- consolidar uma malha responsiva mais previsivel por tipo de fluxo

## Regra de Mudanca

Para qualquer alteracao relevante:

1. alterar o minimo necessario
2. validar com `npm run build`
3. evitar regressao visual em outros fluxos
