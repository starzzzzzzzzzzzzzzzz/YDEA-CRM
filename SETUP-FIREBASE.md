# Login com e-mail/senha + Firestore — como colocar pra funcionar

Login é e-mail e senha, do jeito mais simples possível. **Ninguém se cadastra
sozinho** — só você (admin) cria as contas, pela tela **Equipe** do CRM, e
define o cargo de cada pessoa na hora da criação.

## 1. Projeto e Firestore

Já feitos: `CRM-YDEASOLAR`, banco Firestore criado.

## 2. Ativar login por e-mail/senha

1. No menu lateral do Firebase Console: **Authentication → Sign-in method**.
2. Clique em **Adicionar novo provedor** → **E-mail/senha**.
3. Ative a primeira opção (E-mail/senha) e salve. Não precisa do "link de
   e-mail sem senha".

## 3. Chaves do app Web

Já feitas — estão no seu `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).

## 4. Regras do Firestore

Já publicadas (`firestore.rules`): qualquer pessoa logada lê `usuarios`, só
admin escreve.

## 5. Chave de administrador (Admin SDK)

Isso é o que permite ao painel "Adicionar usuário" criar contas de verdade
(com senha) sem derrubar a sua sessão. É usada tanto pelo script de bootstrap
abaixo quanto pela própria tela do CRM em produção.

1. Configurações do projeto → **Contas de serviço** → **Gerar nova chave
   privada** (baixa um `.json`).
2. Renomeie pra `service-account.json` e coloque na **raiz do projeto**
   (já está no `.gitignore` — nunca comitar, nunca compartilhar).

## 6. Criar a primeira conta de admin (único passo manual)

```
npm install
npm run create-admin
```

Isso cria (ou atualiza, se já existir) a conta:

- **E-mail:** `kauevictor.ydeasolar@gmail.com`
- **Senha:** `Yde@2023`
- **Cargo:** Administrador

Quer usar outro e-mail/senha? Edite o objeto `ADMIN` no topo de
`scripts/create-admin.mjs` antes de rodar.

## 7. Rodar o CRM

```
npm run dev
```

Abra `http://localhost:3000` → `/login` → entre com o e-mail e senha do
passo 6.

## 8. Cadastrar o resto do time

Tudo pela tela **Equipe** dentro do CRM agora:

1. Clique em **"Adicionar usuário"**.
2. Preencha nome, e-mail, uma senha provisória (mín. 6 caracteres) e o cargo.
3. Clique em **Criar usuário** — a conta já nasce pronta pra logar.
4. Passe o e-mail e a senha pra pessoa por um canal seguro (WhatsApp, por
   exemplo). Ela pode trocar a senha depois em "Esqueci minha senha".

Pra trocar o cargo de alguém depois, é só usar o menu ao lado do nome, na
mesma tabela.

## O que mudou por baixo

- **Login:** e-mail/senha (`signInWithEmailAndPassword`), estilo mais direto.
- **Quem pode entrar:** só quem o admin cadastrou. Não existe auto-cadastro —
  toda conta nasce pelo painel de Admin, com Auth + Firestore criados juntos
  numa chamada só (`/api/admin/usuarios`, protegida — só admin pode chamar).
- **Cargos e permissões** (quem vê o quê) continuam definidos no código
  (`src/lib/db/cargos.ts` e `permissoes.ts`).
- Clientes, negócios (funil) e leads **ainda são dados fictícios em memória** —
  próxima frente natural: mover essas coleções pro Firestore também.

## Importante pra produção

Quando for publicar o CRM num servidor de verdade (não só `localhost`),
o arquivo `service-account.json` também precisa existir lá — é ele que a
rota `/api/admin/usuarios` usa pra criar contas em produção. Nunca suba esse
arquivo pro Git; na maioria dos serviços de hospedagem dá pra configurar isso
como uma variável de ambiente segura em vez de um arquivo — se for hospedar
em algo como Vercel, me avisa que ajusto o código pra ler de variável de
ambiente em vez do arquivo local.
