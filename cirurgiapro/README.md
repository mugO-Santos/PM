# 🏥 CirurgiaPro — Sistema de Gestão de Procedimentos Cirúrgicos

## Visão Geral

O **CirurgiaPro** é um sistema web hospitalar progressivo (PWA) para cadastrar procedimentos cirúrgicos com CIDs, valores e parâmetros de tempo, calculando automaticamente os honorários com base no tempo real de cada cirurgia.

**Stack:** React + Vite (frontend) · Node.js / Express (backend) · PostgreSQL via Neon (banco de dados) · Railway (deploy)

---

## Estrutura do Projeto

```
cirurgiapro/
├── backend/
│   ├── src/
│   │   ├── db/index.js          # Conexão Neon + migrations automáticas
│   │   ├── routes/
│   │   │   ├── procedimentos.js # CRUD de procedimentos
│   │   │   └── calculos.js      # Cálculo e histórico
│   │   └── index.js             # Servidor Express + serve frontend
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js         # Cliente HTTP para a API
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Procedimentos.jsx
│   │   │   ├── Calculo.jsx
│   │   │   └── Historico.jsx
│   │   ├── styles/global.css    # Design system hospitalar
│   │   └── utils/format.js      # Formatação BRL, minutos, etc.
│   ├── vite.config.js           # PWA configurado
│   └── package.json
├── railway.toml                 # Configuração de deploy
├── package.json                 # Scripts raiz (build + start)
└── README.md
```

---

## Funcionalidades

### Módulo de Procedimentos
Cadastro completo com:
- Nome e CID (código manual — ver referência de CIDs abaixo)
- Valor base do honorário
- Hora base inclusa no valor
- Valor por hora excedente
- Tipo de anestesia (Geral, Sedação, Local, Regional, Raquidiana, Peridural, Bloqueio de Plexo)
- Observações livres

### Módulo de Cálculo
1. Busca o procedimento por nome ou CID
2. Informa horário de início e término (suporta virada de meia-noite)
3. Calcula automaticamente:
   - Duração total
   - Tempo excedente
   - Valor excedente proporcional ao minuto
   - **Valor total a receber**
4. Salva no histórico com data do procedimento

### Módulo de Histórico
- Tabela completa de todos os cálculos
- Totalização de honorários e excedentes
- Exclusão de registros

---

## Regras de Cálculo

```
Duração Total     = Horário de Término − Horário de Início
Tempo Excedente   = MAX(0, Duração Total − Hora Base)
Valor Excedente   = (Tempo Excedente em minutos ÷ 60) × Valor/h Excedente
Valor Total       = Valor Base + Valor Excedente
```

### Exemplo

```
Procedimento:     Mastopexia
Valor Base:       R$ 20.000,00
Hora Base:        08:00 h
Valor/h exc.:     R$ 600,00

Início: 07:20   Término: 20:20
────────────────────────────────
Duração total:    13h00
Hora base:        08h00
Tempo excedente:  05h00

5,00 h × R$ 600,00 = R$ 3.000,00

Valor Total:  R$ 23.000,00
```

### Proporcional ao minuto

```
Excedente 01:30  →  1,5 × R$600  = R$ 900,00
Excedente 02:15  →  2,25 × R$600 = R$ 1.350,00
Excedente 00:00  →  sem cobrança, total = valor base
```

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Neon](https://neon.tech) (gratuita)

### 1. Clonar e instalar dependências

```bash
git clone <seu-repositorio>
cd cirurgiapro
npm run install:all
```

### 2. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
# Edite backend/.env e cole sua DATABASE_URL do Neon
```

O arquivo `.env` deve conter:
```
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/cirurgiapro?sslmode=require
PORT=3001
```

### 3. Rodar em desenvolvimento

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# API rodando em http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# App rodando em http://localhost:5173
```

O frontend já está configurado para fazer proxy das requisições `/api` para o backend em `localhost:3001`.

---

## Deploy no Railway

### 1. Criar conta e projeto no Railway
Acesse [railway.app](https://railway.app) e crie uma conta gratuita.

### 2. Criar banco no Neon
- Acesse [neon.tech](https://neon.tech)
- Crie um projeto e um banco chamado `cirurgiapro`
- Copie a **Connection String** (formato: `postgresql://...`)

### 3. Deploy

```bash
# Instale a CLI do Railway
npm install -g @railway/cli

# Login
railway login

# Inicialize o projeto
railway init

# Configure a variável de ambiente
railway variables set DATABASE_URL="postgresql://..."

# Deploy
railway up
```

Ou via interface web:
1. Conecte seu repositório GitHub no Railway
2. Adicione a variável `DATABASE_URL` nas configurações do projeto
3. O Railway detecta o `railway.toml` e faz o deploy automaticamente

### 4. As tabelas são criadas automaticamente
Na primeira execução, o backend roda as migrations e cria as tabelas `procedimentos` e `calculos` no Neon.

---

## Instalação como PWA

### Android (Chrome)
Menu (⋮) → "Adicionar à tela inicial" → Confirmar

### iOS (Safari)
Compartilhar (□↑) → "Adicionar à Tela de Início" → Adicionar

### Desktop (Chrome/Edge)
Ícone de instalação (⊕) na barra de endereços → Instalar

---

## Referência de CIDs — Procedimentos Comuns

> Esta seção é uma referência de consulta. Os CIDs **não estão pré-cadastrados** no sistema — devem ser inseridos manualmente pelo usuário no módulo de Procedimentos.

| Procedimento | CID sugerido | Descrição |
|---|---|---|
| Mastopexia | N64.8 | Outras afecções especificadas da mama |
| Mamoplastia de Aumento | Z41.1 | Cirurgia plástica com fins estéticos da mama |
| Abdominoplastia | L98.8 | Outras afecções especificadas da pele e tecido subcutâneo |
| Rinoplastia | J34.8 / Z41.1 | Outras afecções especificadas do nariz |
| Blefaroplastia | H02.3 / Z41.1 | Outras afecções especificadas das pálpebras |
| Lipoaspiração | L98.8 | Afecções da pele e tecido subcutâneo |
| Ritidoplastia (Lifting) | Z41.1 | Cirurgia plástica estética |
| Otoplastia | Q17.5 / Z41.1 | Orelha proeminente |
| Gluteoplastia | Z41.1 | Cirurgia plástica estética |
| Colecistectomia | K80.2 | Cálculo da vesícula biliar sem colecistite |
| Apendicectomia | K37 | Outras apendicites e as não especificadas |
| Hernioplastia Inguinal | K40.9 | Hérnia inguinal sem obstrução |
| Hernioplastia Umbilical | K42.9 | Hérnia umbilical sem obstrução |
| Histerectomia | N85.9 | Afecção não especificada do útero |
| Cesariana | O82 | Parto por cesariana |

> ⚠ Esta tabela é apenas orientativa. Sempre confirme o CID correto com a equipe de codificação médica da instituição.

---

## Tipos de Anestesia

| Tipo | Indicação típica |
|---|---|
| Geral | Procedimentos longos, paciente inconsciente |
| Sedação | Procedimentos curtos, consciência preservada |
| Local | Pequenas cirurgias, área restrita |
| Regional | Membros, bloqueio de nervos periféricos |
| Raquidiana | Abdômen inferior, membros inferiores |
| Peridural | Obstetrícia, cirurgias abdominais longas |
| Bloqueio de Plexo | Membros superiores/inferiores |

---

*CirurgiaPro — Precisão nos honorários, foco no paciente.*
