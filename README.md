# Thunder Note

Thunder Note is a private, AI-powered notes application built with React, Redux, Node.js, Express, and MongoDB. It combines secure note management with Groq-powered generative AI, semantic-aware chat, audio/image/PDF ingestion, smart note transformation, and a dual-theme interface (light and dark).

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Gen AI Logic & Implementation](#gen-ai-logic--implementation)
- [Theme System](#theme-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Design Decisions](#design-decisions)
- [Security Notes](#security-notes)

---

## Overview

Thunder Note lets users register, authenticate, create/edit/delete notes, and converse with a Groq-powered AI assistant that can search, create, update, and organize their private notes. Notes support rich AI tooling — summarization, rewriting, grammar fixes, formatting, smart titles/tags, action-item extraction — plus multimodal ingestion of audio (transcription via Groq Whisper), images (vision OCR/summarization), and text-based PDFs.

The app includes a lightweight search engine (Groq query expansion + lexical ranking) instead of a vector database, so no separate embedding provider or vector index is required.

---

## Core Features

### Authentication
- User registration with bcrypt password hashing
- Login with JWT session tokens (1-day expiry)
- Password comparison via bcrypt
- Protected routes with JWT middleware

### Note Management
- Create, read, update, delete notes
- Tags and categories per note
- Automatic timestamps (created/updated)
- Redux-powered state with loading/error handling
- Real-time note refresh across components via `thunder-notes-changed` events

### AI Note Tools (Editor)
Each note editor exposes quick AI actions:
- **Summarize** — concise summary of note text
- **Reformat** — restructure into a clean note
- **Fix Grammar** — correct spelling/punctuation
- **Smart Title** — AI-generated title + summary + tags (JSON mode)
- **Add audio, image, or PDF** — multimodal file ingestion
- **Record voice note** — browser MediaRecorder → Groq Whisper transcription

### AI Chat Panel
- Streamed SSE responses from Groq
- Persistent chat history per user/session (MongoDB)
- Note-aware context (relevant notes injected into system prompt)
- Function-calling tools:
  - `search_notes` — search private notes by meaning/keywords
  - `create_note` — create a new note
  - `organize_notes` — tag/categorize matching notes
  - `update_note` — update/append to an existing note

### Theming
- Two switchable themes: **Light** and **Dark**
- Theme persists in `localStorage`
- Applied via `data-theme` attribute on `<html>`
- Theme selector in the top navbar

---

## Gen AI Logic & Implementation

All AI features are powered by [Groq](https://groq.com) using the OpenAI-compatible chat/completions API. The backend does **not** require an OpenAI key or a vector database.

### Backend AI Layer (`backend/groq.js`)
- `getGroqApiKey()` — validates `GROQ_API_KEY` is set and not a placeholder
- `groqFetch()` — authorized fetch wrapper with Bearer token, connection-error handling, and 401/403 key validation
- `groqJson()` — safe JSON parsing of Groq responses
- `getGroqResponseError()` — extracts user-facing error messages from Groq error bodies

### AI Chat (`backend/routes/chat_routes.js`)
- **Model:** `GROQ_CHAT_MODEL` (default `openai/gpt-oss-20b`)
- **System prompt:** Defines Thunder Note as a private-note assistant with tool use; notes are treated as untrusted data, not instructions
- **Context injection:** Before each chat turn, the backend:
  1. Expands the user's query into up to 8 alternative search terms via Groq JSON mode (`expandSearchTerms`)
  2. Performs lexical search across the user's recent notes (title/body/summary/tags/category scoring)
  3. Injects matching note content into the system prompt as "Relevant notes"
- **Tool use:** Groq function-calling with auto tool choice. The backend executes up to 4 tool-calling rounds before streaming the final answer
- **Streaming:** SSE (`text/event-stream`) token-by-token delivery to the frontend
- **History:** Chat messages persisted per `userId` + `sessionId` in MongoDB (`ChatMessageModel`)

### AI Transformations (`backend/routes/ai_routes.js` → `POST /api/ai/transform`)
- **Model:** `GROQ_FAST_MODEL`
- Actions: `summarize`, `expand`, `reformat`, `grammar`, `rewrite`, `translate`, `actions`, `metadata`
- `metadata` uses `response_format: { type: "json_object" }` for structured output (title, summary, tags)

### Multimodal Ingestion (`POST /api/ai/ingest`)
- **Audio:** Base64-decoded file → `FormData` → Groq Whisper (`whisper-large-v3-turbo`) transcription
- **Image:** Base64 data URL → Groq vision model (`qwen/qwen3.8-27b`) for text extraction/summarization
- **PDF:** Base64-decoded buffer → Latin-1 text extraction with regex cleanup; rejects image-only/scanned PDFs

### Search Without Embeddings
Groq does not expose a general embeddings endpoint in its public API reference, so Thunder Note uses **Groq query expansion + lexical ranking** over user-filtered notes. This avoids the need for an embedding provider or vector index while remaining private and user-scoped. For very large libraries or strict vector similarity, an embedding provider and vector index can be added separately.

---

## Theme System

Thunder Note ships with two themes that can be toggled from the navbar:

| Theme | Description |
|-------|-------------|
| **Light** | White background with sky blue (`#1876a5`) and crimson (`#9c2839`) accent colors |
| **Dark** | Near-black background (`#0a0e14`) with sky blue (`#38bdf8`) and crimson (`#ef4444`) accent colors |

### Implementation
- `frontend/src/ThemeContext.js` — React context with `ThemeProvider` and `useTheme` hook
- Theme state is persisted to `localStorage` under key `"theme"`
- `data-theme` attribute (`light` or `dark`) is set on `<html>` on every change
- All component colors use CSS custom properties (`var(--ink)`, `var(--paper)`, `var(--sage)`, etc.) defined per theme in `frontend/src/App.css`
- `App.js` wraps the app with `ThemeProvider` in `frontend/src/index.js`

### Theme Selector
Rendered in `frontend/src/components/Home/Navbar/Navbar.jsx` as a `<select>` dropdown:
- `White · Sky & Crimson` → `data-theme="light"`
- `Dark` → `data-theme="dark"`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router DOM, Redux + Redux Thunk, Chakra UI, React Icons |
| Styling | CSS (CSS custom properties per theme), `@emotion/react`, `@emotion/styled` |
| Backend | Node.js, Express, CORS, dotenv |
| Database | MongoDB + Mongoose (User, Note, ChatMessage models) |
| Auth | bcrypt (password hashing), jsonwebtoken (JWT) |
| AI | Groq API (chat completions, Whisper transcription, vision) |
| HTTP Client | axios (frontend), node-fetch (backend) |
| Build Tool | Create React App (`react-scripts`) |

---

## Project Structure

```
ThunderNote-GenAI/
├── README.md
├── backend/
│   ├── index.js                 # Express app entry point
│   ├── .env                     # Environment variables (not committed)
│   ├── db.js                    # MongoDB connection
│   ├── groq.js                  # Groq API client wrapper
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── UserModel.js
│   │   ├── NoteModel.js
│   │   └── ChatMessageModel.js
│   ├── routes/
│   │   ├── user_routes.js       # register / login
│   │   ├── note_routes.js       # note CRUD
│   │   ├── chat_routes.js       # AI chat (SSE + history)
│   │   └── ai_routes.js         # AI transform / ingest
│   └── test/
│       ├── groq.test.js
│       └── chat_notes.test.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── index.js             # React root (BrowserRouter, ChakraProvider, Redux, ThemeProvider)
│   │   ├── ThemeContext.js      # Light/dark theme context + persistence
│   │   ├── App.js               # Shell: Navbar + AllRoutes
│   │   ├── App.css              # Theme variables + component styles
│   │   ├── index.css            # Global reset
│   │   ├── constants/
│   │   │   └── config.js        # BASE_URL + AI error helper
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   ├── users/           # user_types, user_reducer, user_actions
│   │   │   └── notes/           # note_types, note_reducer, note_actions
│   │   ├── components/
│   │   │   ├── Home/Navbar/     # Navbar + theme selector
│   │   │   └── Notes/NoteCard/  # Note card component
│   │   ├── pages/
│   │   │   ├── Homepage.jsx
│   │   │   ├── Notespage.jsx    # Notes grid + editor + AI tools + file ingestion
│   │   │   ├── Loginpage.jsx
│   │   │   └── Signuppage.jsx
│   │   ├── Chatbot.jsx          # Floating AI chat panel (SSE streaming)
│   │   ├── routes/
│   │   │   ├── AllRoutes.jsx
│   │   │   └── PrivateRoute.jsx
│   │   └── components/3D/AnimatedBackground.jsx
│   ├── package.json
│   └── ...
```

---

## API Overview

All authenticated endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/user/register` | Register a new user |
| `POST` | `/user/login` | Login and receive JWT |
| `GET` | `/note` | List user's notes |
| `POST` | `/note/create` | Create a note |
| `PATCH` | `/note/` | Update a note |
| `DELETE` | `/note/` | Delete a note |
| `POST` | `/api/chat` | Stream AI chat response (SSE) |
| `GET` | `/api/chat/history?sessionId=...` | Fetch chat history |
| `POST` | `/api/ai/transform` | AI note action (summarize, reformat, grammar, etc.) |
| `POST` | `/api/ai/ingest` | Ingest audio/image/PDF file |

---

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (`mongodb://localhost:27017/thunder_note`)
- A valid [Groq API key](https://console.groq.com)

### 1. Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your values
cp .env.example .env   # if available, otherwise create backend/.env manually
npm start
```
Backend runs on `http://localhost:5000` by default.

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000` by default.

### 3. Verify
- Open `http://localhost:3000`
- Register an account, then sign in
- Try the AI chat panel and note editor tools
- Toggle themes from the navbar

---

## Environment Variables

### `backend/.env`
```
mongoURL=mongodb://localhost:27017/thunder_note
GROQ_API_KEY=your_valid_groq_api_key_here
JWT_SECRET=a_long_private_random_value
PORT=5000
```

### Optional Groq model overrides
```
GROQ_CHAT_MODEL=openai/gpt-oss-20b
GROQ_FAST_MODEL=openai/gpt-oss-20b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo
```

### `frontend/src/constants/config.js`
```
export const BASE_URL = "http://localhost:5000";
```
Update this if you change the backend `PORT`.

> **Security:** Never commit `backend/.env` or expose `GROQ_API_KEY`/`JWT_SECRET` in client-side code or version control.

---

## Design Decisions

1. **No vector database:** Groq's public API reference does not list a general embeddings endpoint, so search uses Groq query expansion + lexical scoring over user-scoped notes. This keeps the stack simple and private.
2. **SSE streaming:** Chat responses stream token-by-token for low perceived latency; chat history is persisted in MongoDB per user/session.
3. **CSS custom properties theming:** Theme colors are defined as CSS variables per `data-theme`, avoiding runtime style injection and supporting prefers-reduced-motion.
4. **Redux + local persistence:** Auth state (token/user) lives in Redux; theme preference lives in `localStorage`.
5. **Function calling:** The AI assistant uses Groq tool choice to search, create, update, and organize notes directly from chat.

---

## Security Notes

- Passwords are hashed with bcrypt (salt rounds: 5) before storage
- JWT tokens expire after 1 day; protected routes validate the token via middleware
- All mutating endpoints require a valid `Authorization` header
- Note data is scoped to the authenticated user (`user` field indexed in MongoDB)
- Groq API key is validated on the server and never exposed to the browser
- Treat `GROQ_API_KEY` and `JWT_SECRET` as secrets; do not commit them
#   T h u n d e r N o t e - G e n A I 
 
 
