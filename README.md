# 🌙 Luna

> **An elegant, offline-first eBook reader and audiobook companion platform.**

Luna is designed for book lovers who want a private, distraction-free reading and listening experience without relying on cloud services. Built with a fast **Python FastAPI** backend and a responsive **React + TypeScript + Vite** frontend, Luna keeps your library, annotations, and reading progress completely local.

---

## ✨ Features

- 📖 **Local eBook Library**: Seamlessly import and manage your PDF books with automatic title and page count extraction.
- 🎧 **Built-in Audio Player**: Listen to companion audiobooks with playback speed controls (0.75x – 2x), scrubbing, and a persistent bottom player bar.
- 👓 **Distraction-Free Reader**: Clean reading environment with light, dark, and sepia themes, adjustable font sizing, page navigation, and reading progress tracking.
- 📊 **Reading Analytics**: Track reading streaks, total reading hours, completed books, and current listening progress.
- 🔒 **Offline-First & Private**: Zero external telemetry. All books and SQLite database records reside strictly on your local machine (`local-data/`).
- ⚡ **Streamlined Uploads**: Chunked streaming file ingestion with strict magic-byte validation (`%PDF-`), automatic orphan cleanup, and path-traversal protection.
- 🎨 **Modern Aesthetics**: Curated dark-mode interface with glassmorphism, responsive navigation, and micro-interactions powered by pure CSS and Lucide icons.

---

## 🏗️ Project Architecture

```
luna/
├── backend/
│   ├── main.py              # FastAPI server & REST API endpoints
│   ├── database.py          # SQLite database schema, helpers & connection management
│   └── requirements.txt     # Python dependencies (FastAPI, uvicorn, pypdf, etc.)
├── frontend/
│   ├── index.html           # HTML entry point
│   ├── package.json         # Frontend dependencies & scripts
│   ├── vite.config.ts       # Vite build & dev-server configuration
│   └── src/
│       ├── components/      # UI components (Header, Sidebar, Player, Modal, BookCard, etc.)
│       ├── pages/           # Views (Dashboard, Library, Reader, Audiobooks, Playlists, Device, Settings)
│       ├── context/         # App state management (active book, player, notifications)
│       ├── services/        # Backend API service integration
│       └── index.css        # Pure CSS design system & typography
└── local-data/              # Local storage directory (git-ignored)
    ├── books/               # Ingested PDF files
    ├── audio/               # Audiobook tracks
    └── database/            # SQLite storage (`luna.db`)
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python**: 3.10+ installed
- **Node.js**: v18+ and `npm` installed

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   python main.py
   ```
   *The API will be available at **http://127.0.0.1:8000** (Interactive API docs at `http://127.0.0.1:8000/docs`).*

---

### 2. Frontend Setup

1. In a separate terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open your browser at **http://localhost:5173** to use Luna.*

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and storage path verification |
| `GET` | `/api/books` | List all imported books and reading progress |
| `POST` | `/api/books/import` | Upload a PDF eBook (validates header, extracts metadata, saves to `local-data/books/`) |
| `GET` | `/api/books/{id}/pdf` | Securely stream PDF file contents to the reader |

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, Uvicorn, SQLite3, PyPDF
- **Frontend**: React 18, TypeScript, Vite, Lucide React
- **Styling**: Vanilla CSS with custom property design tokens
- **Data Persistence**: Local SQLite database & local filesystem

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).