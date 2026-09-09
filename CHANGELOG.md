# Changelog — CRM Ydea Solar

Este arquivo registra, em ordem cronológica, o que cada versão entregue faz e o que mudou em relação à anterior. A partir de agora, toda entrega de código vem acompanhada de uma atualização aqui.

---

## v6 — Funil/Negócios 100% real (Firestore) — *versão atual*

**O que esta versão faz:**
- O Kanban do Funil lê e grava negócios de verdade no Firestore — arrastar um card entre etapas persiste.
- Criar um negócio novo salva no Firestore (não é mais um objeto local que some ao recarregar a página).
- Botões **Ganho** e **Perdido** no detalhe do negócio agora gravam o status de verdade, com data de fechamento e (no caso de "Perdido") motivo opcional.
- Aba **Anotações** no negócio: escreve e salva de verdade no Firestore (subcoleção `deals/{id}/anotacoes`), com autor e data/hora.
- Aba **Atividades**: cadastro completo de atividade (tipo, prioridade, data, hora de início/fim, responsável, observações), lista de pendentes/concluídas, marcar como concluída — tudo salvo no Firestore (subcoleção `deals/{id}/atividades`).
- **Trocar o responsável/proprietário** do negócio direto pelo detalhe (dropdown com a equipe cadastrada).
- **Documentos e fotos**: upload de verdade pro Firebase Storage (conta de energia, CPF, RG, CNH, comprovante, kit fotovoltaico, projeto, imagens de drone), com preview, contador de arquivos e exclusão.
- Menu de três pontinhos no negócio: **Exportar anotações** (baixa um .txt), **Duplicar negócio** (copia os dados principais pra um negócio novo), **Excluir negócio** (com confirmação).
- Campos "Personalizados" do negócio alinhados com o que existe de verdade no SolarZ: Perfil do cliente, Prioridade de instalação, Tipo de telhado, Concessionária, Fase da rede, Consumo médio, Potência do sistema, Tensão da rede, Validade da proposta, Drone, Conta Contrato, Carga instalada, Troca de titularidade, Valor do Projeto, NPS Venda/Instalação/Pós-venda.

**O que mudou desde a v5:**
- Removida a página de detalhe do negócio antiga (`/funil/[id]`) que tinha bugs de tipo — ela nem era usada pelo app (o Kanban sempre abriu o painel lateral `DealDetailPanel`, não essa rota).
- `mock-deals.ts` removido — negócios não são mais fictícios.
- Novos arquivos: `lib/firebase/deals.ts`, `lib/firebase/anotacoes.ts`, `lib/firebase/atividades.ts`, `lib/firebase/storage.ts`.
- Novas regras de segurança: Firestore (`deals` + subcoleções) e Storage (`storage.rules`, arquivo novo — **precisa ser publicado separadamente no Console**, na aba Storage → Regras).
- Novos tipos em `lib/types.ts`: `Anotacao`, `Atividade`, `AtividadeTipo`, `PerfilCliente`, mais campos no `Deal` (`perfilCliente`, `concessionaria`, `npsVenda/Instalacao/PosVenda`, `motivoPerda`, `fechadoEm`) e no `DocumentoAnexo` (`storagePath`, `uploadedAt`).

**O que ainda falta (conhecido, não é bug):**
- **Propostas** e **Financiamentos**: botões existem na tela mas mostram "ainda não implementado" — ficam pra depois, como combinado.
- Upload de documento **durante a criação** do negócio (no formulário de "Novo negócio") ainda é só preview local — o upload de verdade acontece depois, abrindo o negócio já criado.
- **Leads** continuam fictícios em memória.
- Importação do SolarZ (via API deles) ainda não iniciada — aguardando token de acesso.

---

## v5 — Clientes 100% real (Firestore)

- Cadastro de cliente (`/clientes/novo`) grava de verdade no Firestore.
- Lista de clientes (`/clientes`) lê do Firestore, com loading e linhas clicáveis.
- Detalhe do cliente (`/clientes/:id`) busca do Firestore.
- Corrigidos bugs de tipo herdados de uma geração anterior; removidos dois arquivos mortos (`ClientesTable.tsx`, `NewClienteModal.tsx`) que não eram usados em lugar nenhum do app.
- Nova regra de Firestore para a coleção `clientes`.

## v4 — Auto-cadastro + painel de Admin (login com e-mail/senha)

- Login trocado de Google para e-mail/senha, com painel de Admin dentro do próprio CRM: você cria as contas do time (nome, e-mail, senha provisória, cargo) direto pela tela **Equipe**, sem terminal.
- Rota de API protegida (`/api/admin/usuarios`) usa o Firebase Admin SDK no servidor pra criar a conta de login e o cadastro no Firestore ao mesmo tempo.
- Script `scripts/create-admin.mjs` — cria a primeira conta de administrador (único passo manual necessário pra "destravar" o sistema).

## v3 — Login com Google (tentativa intermediária, substituída na v4)

- Login trocado de decorativo pra Google Sign-In, com auto-provisionamento de conta como "pendente" até um admin aprovar. Substituído pelo modelo de e-mail/senha na v4 a pedido do Kauê (mais simples pro time usar).

## v2 — Login real com Firebase Auth (e-mail/senha, primeira versão)

- Primeira versão de login de verdade (antes disso era só decorativo).
- Usuários migrados de um array fictício no código pra uma coleção `usuarios` no Firestore.
- Botão "Sair" real substituindo o antigo "trocar de usuário (demo)".

## v1 — RBAC (cargos e permissões) — ponto de partida desta série de entregas

- Sistema de cargos e permissões (Administrador, Vendedor, Projetista, Financeiro, Instalação, Pós-venda) já existia, com dashboard, menus e funis filtrados por cargo — mas tudo em memória (arrays no código), sem login real nem banco de dados. Esse era o estado do projeto quando essas entregas começaram.
