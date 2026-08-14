# 🚀 CareerPilot AI

**AI-Powered Job Discovery, Matching & Application Assistant**

CareerPilot AI is an intelligent career agent that automatically discovers jobs from multiple sources, matches them against your profile using AI, and helps you prepare tailored applications.

## Architecture

```
                    ┌─────────────────────┐
                    │      Next.js        │  ← Frontend (Port 3000)
                    │   TypeScript + UI   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │       NestJS        │  ← Backend API (Port 3001)
                    │   TypeScript API    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
┌─────────▼─────────┐  ┌──────▼──────┐  ┌───────────▼──────────┐
│   Supabase        │  │  FastAPI    │  │   Job Connectors     │
│   PostgreSQL      │  │  AI Service │  │                      │
│   + pgvector      │  │  (Port 8000)│  │ Greenhouse │ Lever   │
└───────────────────┘  └─────────────┘  │ Ashby      │ ...     │
                                        └──────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | NestJS, TypeScript, Prisma |
| AI | Python, FastAPI, LangChain, OpenAI |
| Database | Supabase PostgreSQL + pgvector |
| Auth | Clerk |
| Job Sources | Greenhouse, Lever, Ashby (public APIs) |

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- Supabase account (free tier)
- Clerk account (free tier)

### Setup

1. **Clone and install:**
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# AI Service
cd ai-service && pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Fill in your Supabase and Clerk credentials
```

3. **Run database migrations:**
```bash
cd backend && npx prisma migrate dev
```

4. **Start all services:**
```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Backend
cd backend && npm run start:dev

# Terminal 3 — AI Service
cd ai-service && uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
careerpilot-ai/
├── frontend/          # Next.js web application
├── backend/           # NestJS API server
├── ai-service/        # Python FastAPI AI service
├── .env.example       # Environment variable template
└── README.md
```

## License

MIT
