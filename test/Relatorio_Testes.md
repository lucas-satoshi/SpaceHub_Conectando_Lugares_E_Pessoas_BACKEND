# Relatório de Testes - SpaceHub Backend

Este documento serve como relatório consolidado das rodadas de testes (Manuais e Automatizados) da plataforma SpaceHub. As evidências (imagens do Postman) estão salvas na pasta local `test_evidences/`.

## 1. Testes Automatizados E2E

A suíte de testes ponta a ponta (E2E) foi configurada utilizando o framework **Jest** com a biblioteca **Supertest**, verificando os principais fluxos de negócio diretamente no servidor NestJS integrado ao banco de dados Postgres no Supabase.

**Resultado:**
```bash
> jest --config ./test/jest-e2e.json

PASS test/app.e2e-spec.ts (41.713 s)
  AppController (e2e) e Fluxo Completo SpaceHub
    1. Fluxo de Autenticação
      √ deve registrar um usuário HOST 
      √ deve registrar um usuário GUEST 
    2. Fluxo de Espaços (Spaces)
      √ não deve permitir criar espaço como GUEST 
      √ deve criar um espaço como HOST 
    3. Fluxo de Reservas (Bookings)
      √ deve criar uma reserva no espaço criado 

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
```

## 2. Testes Manuais (Evidências no Postman)

Antes da automatização, os fluxos foram exaustivamente validados de forma manual. Abaixo as evidências (screenshots) das respostas capturadas:

### 2.1 Registro e Login (Autenticação)
- **Criação de Host / Login e obtenção do Token:**
![Registro Host](./test_evidences/media_1787267955877.png)
![Login Host](./test_evidences/media_1787267961499.png)

- **Criação de Guest e obtenção do Token:**
![Guest Creation](./test_evidences/media_1787268874859.png)

### 2.2 Criação e Validação de Espaços
- **Tentativa de criação de Espaço sem ser HOST (Bloqueado / 403 Forbidden):**
![Guest negado](./test_evidences/media_1787268581780.png)

- **Criação de Espaço como HOST (Sucesso):**
![Criação de espaço](./test_evidences/media_1787268765831.png)

### 2.3 Reservas (Bookings) e Tratamento de Conflitos
- **Reserva de um espaço como Guest:**
![Booking criado](./test_evidences/media_1787269164335.png)

- **Cálculo automático do valor total (Preço por noite * Diárias):**
![Cálculo](./test_evidences/media_1787269236681.png)

- **Tentativa de criação de reserva conflitante nas mesmas datas (Bloqueado / 409 Conflict):**
![Conflito de Datas](./test_evidences/media_1787269276579.png)

---
*Demais evidências de requisições capturadas:*
![Evidência Extra 1](./test_evidences/media_1787268176803.png)
![Evidência Extra 2](./test_evidences/media_1787268277481.png)
![Evidência Extra 3](./test_evidences/media_1787268349415.png)
![Evidência Extra 4](./test_evidences/media_1787268551531.png)
![Evidência Extra 5](./test_evidences/media_1787269028440.png)

---
**Status Geral de Funcionalidades:** Aprovado ✅
