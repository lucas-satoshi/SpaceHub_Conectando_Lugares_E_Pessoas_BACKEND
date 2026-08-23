# SpaceHub API - Backend

O **SpaceHub** é uma plataforma desenvolvida para conectar pessoas a espaços, permitindo o gerenciamento e a reserva de imóveis, salas de reunião e coworkings. Este repositório contém a API (backend) do projeto, responsável por centralizar os dados, garantir a confiabilidade da disponibilidade e fornecer segurança nas transações.

## 🚀 Tecnologias Utilizadas

A arquitetura do servidor foi construída utilizando tecnologias modernas para garantir performance e segurança:

* **Framework:** NestJS (Node.js)
* **ORM:** Prisma (`prisma/schema.prisma`)
* **Banco de Dados:** PostgreSQL (Padrão sugerido para uso com Prisma)


* **Segurança:** Autenticação via JWT (JSON Web Token) e criptografia de senhas com Bcrypt


* **Upload de Arquivos:** Módulo de upload integrado (preparado para serviços em nuvem como Cloudinary ou AWS S3)



## ⚙️ Arquitetura e Módulos Principais

A API está dividida em módulos focados em domínios específicos da aplicação (`src/modules/`):

* **Auth (`/auth`):** Gerencia a criação de contas e o login seguro, diferenciando perfis de Anfitrião (Host) e Hóspede (Guest). Utiliza `jwt.strategy` e rotas protegidas por Guards (`jwt-auth.guard.ts`, `roles.guard.ts`).


* **Users (`/users`):** Gerenciamento de perfis e dados sensíveis dos usuários cadastrados.
* **Spaces (`/spaces`):** Responsável pelo Catálogo Dinâmico. Permite ao anfitrião fazer o CRUD (criar, ler, atualizar e deletar) de seus imóveis. Inclui sistema de buscas e filtros (DTOs de query) por localização e características do espaço.


* **Bookings (`/bookings`):** O Motor de Reservas. Valida a disponibilidade do espaço para impedir *overbooking* (reservas duplicadas no mesmo período) antes de efetivar a transação no banco de dados.


* **Upload (`/upload`):** Gerenciamento de mídias, permitindo o envio e armazenamento de fotos dos espaços anunciados.



## 🛡️ Regras de Negócio e Segurança

Este backend foi projetado para evitar falhas críticas de negócio e segurança:

* **Prevenção de Overbooking:** A lógica de reservas (Bookings Service) detecta conflitos de agenda e bloqueia transações se o espaço já estiver ocupado nas datas solicitadas.


* **Proteção de Rotas (Prevenção IDOR):** O sistema garante que apenas o dono do anúncio possa editá-lo ou excluí-lo, utilizando os decorators de usuários e validação de tokens JWT.


* **Criptografia:** Nenhuma senha é armazenada em texto puro; todas passam por hash antes de irem para o banco.


* **Tratamento de Exceções:** Uso de interceptors e filtros (`http-exception.filter.ts`, `logging.interceptor.ts`) para garantir que erros retornem mensagens claras e controladas sem derrubar o servidor.



## 🛠️ Como rodar o projeto localmente

### Pré-requisitos

* Node.js (v18+)
* Banco de dados PostgreSQL rodando localmente ou em nuvem.

### Passos de Instalação

1. Clone o repositório e instale as dependências:

```bash
npm install

```

2. Configure as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/spacehub?schema=public"
JWT_SECRET="sua_chave_secreta_aqui"
# Adicione chaves do Cloudinary/S3 conforme necessário

```

3. Execute as migrações do banco de dados utilizando o Prisma:

```bash
npx prisma migrate dev

```

4. Inicie o servidor em modo de desenvolvimento:

```bash
npm run start:dev

```

A API estará rodando, por padrão, em `http://localhost:3000`.

## 🧪 Testes

O projeto conta com uma suíte de testes ponta a ponta (e2e) para garantir o funcionamento das rotas principais.
Para rodar os testes:

```bash
npm run test:e2e

```