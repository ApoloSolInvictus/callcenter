# Lux Aeterna Call Center AI

AI command center for call center agents, supervisors, and business customers. The app converts platform-specific call-center data into a universal schema, then uses a server-side OpenAI endpoint for live agent assist, escalation detection, compliance alerts, and next-best-action guidance.

## Stack

- Next.js App Router + TypeScript
- OpenAI Responses API with structured JSON output
- Multi-platform adapter layer for Genesys, Five9, and NICE CXone
- Vercel-ready API route at `/api/ai-assist`

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` for real AI responses:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

Without `OPENAI_API_KEY`, the API returns deterministic demo assistance so the UI still works locally.

## Vercel

Import this GitHub repository in Vercel:

```text
https://github.com/ApoloSolInvictus/callcenter.git
```

Set these environment variables in the Vercel project:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` default: `gpt-5.4-mini`

Recommended project settings:

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: Next.js default

The app builds with:

```bash
npm run build
```

## Project Shape

- `src/app/page.tsx` main AI operations console
- `src/app/api/ai-assist/route.ts` server-side OpenAI endpoint
- `src/lib/ai-assist.ts` structured output schema and demo fallback
- `src/lib/platforms.ts` universal schema, platform catalog, and adapters
- `src/lib/mock-data.ts` live call simulation data
- `src/types/call-center.ts` domain types

## GitHub

Remote:

```bash
git remote add origin https://github.com/ApoloSolInvictus/callcenter.git
git push -u origin main
```
