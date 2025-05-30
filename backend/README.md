# 📚 API do Chat - NestJS

## ✅ Visão Geral

Esta API gerencia três principais recursos:

* **Usuários**: registro, autenticação, gerenciamento.
* **Chats**: criação e gerenciamento de conversas.
* **Mensagens**: envio, atualização, visualização e exclusão de mensagens em tempo real.

---

## 🛠️ Tecnologias utilizadas

* **NestJS** - Estrutura principal.
* **Prisma ORM** - Manipulação do banco de dados.
* **JWT** - Autenticação.
* **BcryptJS** - Criptografia de senhas.
* **Passport** - OAuth com Google.
* **WebSocket (Gateway)** - Comunicação em tempo real.
* **Class-validator** - Validação de dados.

---

## 📦 Endpoints

---

## 🧑‍💻 Usuário

### 🔹 POST `/user/register`

**Descrição:** Cria um novo usuário com e-mail e senha.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "birth": "1990-01-01",
  "password": "Senha@123",
  "passwordConfirmation": "Senha@123"
}
```

**Validações:**

* Nome, e-mail e senha obrigatórios.
* E-mail válido.
* Senhas devem ser iguais.

---

### 🔹 POST `/user/login`

**Descrição:** Autenticação tradicional via e-mail e senha.

**Body:**

```json
{
  "email": "joao@email.com",
  "password": "Senha@123"
}
```

**Resposta:** `{ "token": "<jwt_token>" }`

---

### 🔹 POST `/user/register-oauth`

**Descrição:** Finaliza registro de usuário autenticado via OAuth (Google).

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "birth": "1990-01-01",
  "provider": "google"
}
```

---

### 🔹 GET `/user/google`

**Descrição:** Redireciona para autenticação Google OAuth.

---

### 🔹 GET `/user/google/redirect`

**Descrição:** Redirecionamento após autenticação Google. Gera token JWT e redireciona para o Frontend com o token.

---

### 🔹 GET `/user`

**Descrição:** Lista todos os usuários, exceto o logado.

**Headers:** Authorization: Bearer `<token>`

---

### 🔹 GET `/user/me`

**Descrição:** Retorna os dados do usuário logado.

---

### 🔹 DELETE `/user`

**Descrição:** Remove o usuário logado, gerenciando os chats que ele participa.

---

##  Chat

### 🔹 Criar Chat

**Descrição:** Cria um chat com participantes específicos.

**Body:**

```json
{
  "participants": ["id_usuario1", "id_usuario2"]
}
```

**Resposta:** Dados do chat criado.

---

### 🔹 Buscar Chats

**Descrição:** Recupera todos os chats que o usuário participa.

---

### 🔹 Atualizar Chat

**Descrição:** Pode ser usado para alterar participantes, status, etc.

---

### 🔹 Deletar Chat

**Descrição:** Soft delete do chat (não exclui fisicamente, apenas desativa).

---

## 💬 Mensagem

### 🔹 POST `/message/send-message`

**Descrição:** Envia uma nova mensagem.

**Headers:** Authorization: Bearer `<token>`

**Body:**

```json
{
  "message": "Olá, tudo bem?",
  "chatId": "chat123",
  "recipients": ["user456", "user789"]
}
```

**Resposta:** Mensagem criada.

---

### 🔹 GET `/message/:id`

**Descrição:** Recupera todas as mensagens de um chat específico.

**Headers:** Authorization: Bearer `<token>`

**Parâmetros:** `id`: ID do chat.

---

### 🔹 PUT `/message/:id`

**Descrição:** Atualiza uma mensagem existente.

**Body:**

```json
{
  "message": "Mensagem editada"
}
```

**Validações:** Apenas o conteúdo da mensagem pode ser alterado. O status será automaticamente definido como `EDITED`.

---

### 🔹 PATCH `/message/view-message`

**Descrição:** Marca uma ou mais mensagens como visualizadas.

**Body:**

```json
{
  "ids": ["msg123", "msg456"]
}
```

**Efeito:** Atualiza o campo `seenStatus` para `SEEN` e notifica via WebSocket.

---

### 🔹 DELETE `/message/:id`

**Descrição:** Soft delete da mensagem. Altera o conteúdo para "Mensagem excluída".

---

## 🔒 Autenticação

* **JWT:** Protege rotas sensíveis.
* **Guards:** `JwtAuthGuard` e `Passport Google AuthGuard`.
* **WebSocket:** Notificações em tempo real via `MessageGateway`.

---

## 🎯 Estrutura dos DTOs

### ✅ CreateUserDTO

* `name`: string (obrigatório)
* `email`: string (obrigatório)
* `birth`: string
* `password`: string
* `passwordConfirmation`: string
* `provider`: string (opcional)

---

### ✅ LoginUserDTO

* `email`: string (obrigatório)
* `password`: string (obrigatório)

---

### ✅ UpdateUserDTO

* `name`, `email`, `birth`, `password`, `passwordConfirmation`, `provider`: todos opcionais.
* `password` exige força mínima: 8 caracteres, maiúscula, minúscula, número e símbolo.

---

### ✅ CreateChatDTO

* `participants`: string[] — IDs dos participantes do chat.

---

### ✅ UpdateChatDTO

* `participants?`: string[] — Lista opcional para atualizar participantes.
* `active?`: boolean — Define se o chat está ativo ou não.

---

### ✅ CreateMessageDTO

* `recipients`: array de IDs de usuários.
* `message`: conteúdo da mensagem.
* `chatId`: ID do chat.

---

## 📡 Comunicação em tempo real

* Sempre que uma mensagem é enviada, editada, visualizada ou excluída, todos os participantes do chat são notificados via WebSocket.

---

## 📝 Considerações Finais

* Projeto estruturado com separação clara de **Controller**, **Service** e **DTOs**.
* **Prisma** garante integração robusta com o banco.
* **Validação** e **tratamento de exceções** cuidadosos.
* Lógica de **Soft Delete** preserva dados.
* Suporte a **OAuth** via Google.

---

## 🚀 Como rodar?

```bash
npm install
npm run start:dev
```

---

### Link da API Online

A API está disponível no endereço abaixo para que você possa testar e integrar diretamente:

[API Chat - Ambiente de Produção](https://chat-production-406c.up.railway.app/)

---

### Como usar a API Online

- **Autenticação:**  
  Para acessar rotas protegidas, como envio de mensagens e gerenciamento de usuários, é necessário obter um token JWT.  
  Faça login pelo endpoint `/user/login` enviando email e senha para receber o token.  
  Em seguida, inclua no header das requisições protegidas:  
  `Authorization: Bearer <seu_token_jwt>`

- **Rotas públicas:**  
  Alguns endpoints, como registro de usuário (`/user/register`) e autenticação via OAuth (`/user/google`), não requerem token.

- **Comunicação em tempo real:**  
  O WebSocket está disponível para receber notificações de mensagens enviadas, editadas ou visualizadas. Para conectar, use a URL de WebSocket fornecida na documentação do projeto (ex: `wss://chat-production-406c.up.railway.app/ws`).

- **Formato das requisições:**  
  Envie os dados no formato JSON via POST, PUT ou PATCH conforme o endpoint utilizado.

---

## ✅ To-Do Futuro:

* Implementar **upload de arquivos** nas mensagens.
* Melhorar sistema de **logs**.
* Criar **filtros** de busca nas mensagens e chats.
* **Testes unitários e e2e**.
