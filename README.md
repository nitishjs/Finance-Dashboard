# 💰 FINGold — Personal Finance Dashboard

A production-ready premium SaaS personal finance dashboard built with React, TypeScript, Tailwind CSS v4, and Supabase.

---

## 🚀 Quick Start

### 1. Clone & install
```bash
cd fingold
npm install
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Run `src/supabase/schema.sql` in your Supabase SQL Editor
3. Copy your project URL and anon key

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
# Push to GitHub, then connect repo in Vercel
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables
```

---

## ✅ Features

| Feature | Status |
|---|---|
| Landing page (hero, features, pricing, FAQ) | ✅ |
| Auth — login, register, forgot password | ✅ |
| Protected routes with auth guard | ✅ |
| Dashboard — KPIs, charts, health score | ✅ |
| Income management (CRUD) | ✅ |
| Expense management (CRUD + categories) | ✅ |
| Budget planner (monthly, category alerts) | ✅ |
| Financial goals with progress rings | ✅ |
| Savings tracker with growth chart | ✅ |
| Transactions — search, filter, sort, paginate | ✅ |
| Analytics — bar/pie/line/area charts | ✅ |
| AI Finance Assistant (Claude-powered) | ✅ |
| Profile & settings | ✅ |
| Toast notifications | ✅ |
| Responsive dark luxury UI | ✅ |
| Row Level Security (Supabase RLS) | ✅ |

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── layout/      # AppShell, Sidebar
│   └── ui/          # Card, Button, Input, Modal, Progress…
├── contexts/        # AuthContext
├── hooks/           # useToast
├── pages/           # All 10 app pages
├── services/        # Supabase CRUD layer
├── supabase/        # client.ts, schema.sql
├── types/           # TypeScript interfaces
└── utils/           # formatCurrency, cn, constants
```

---

## 🎨 Design Tokens

| Token | Value |
|---|---|
| Background | `#0A0A0A` |
| Card | `#151515` |
| Gold accent | `#D4AF37` |
| Success | `#3DAA7A` |
| Danger | `#C94F4F` |
| Border | `rgba(255,255,255,0.07)` |

---

## 🤖 AI Assistant

The AI page uses the Anthropic API (`claude-sonnet-4-6`) to provide personalised finance advice grounded in your actual income/expense/goal data. The API is called client-side — for production, proxy through a backend function to protect your API key.
