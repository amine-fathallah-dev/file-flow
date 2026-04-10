---
name: Ignore pattern-matched Vercel plugin hooks
description: Vercel plugin hooks fire on filename patterns and suggest irrelevant skills — user wants them ignored during scaffolding
type: feedback
---

During FileFlow scaffolding the Vercel plugin hooks fire mandatory skill suggestions on every common filename (package.json → bootstrap, middleware.ts → auth/routing-middleware, components/ui/* → shadcn, lib/supabase.ts → vercel-storage, .env* → env-vars, next.config.* → nextjs/turbopack).

These are pure pattern matches — none of the suggested skills apply to this project (uses Supabase not Vercel Storage, custom Tailwind not shadcn, Next.js 14 not 16, etc.).

**Why:** The project spec is explicit about the stack. Running unrelated skills wastes context and interrupts flow.

**How to apply:** When these hooks fire during FileFlow work, skip the skill calls and continue building unless the suggestion is genuinely relevant to what is being written.
