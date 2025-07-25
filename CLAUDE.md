# Claude AI Development Guide - CodeClimbers App

This is a Tauri application with React TypeScript frontend and Rust backend.

## Development Guides

For detailed development patterns and practices, please refer to:

- **Frontend Development**: `src/CLAUDE.md` - React TypeScript patterns, data architecture, and component guidelines
- **Backend Development**: `src-tauri/CLAUDE.md` - Rust patterns, Tauri commands, and backend architecture

## Quick Reference

When working on:
- **Frontend features** (React components, API calls, UI): Follow `src/CLAUDE.md`
- **Backend features** (Tauri commands, system integration, Rust code): Follow `src-tauri/CLAUDE.md`
- **Full-stack features**: Read both guides to understand the complete data flow

## Project Structure

```
├── src/                    # React TypeScript frontend
│   └── CLAUDE.md          # Frontend development guide
├── src-tauri/             # Rust backend
│   └── CLAUDE.md          # Backend development guide
└── CLAUDE.md              # This file - main entry point
```

Always read the appropriate CLAUDE.md file before making changes to ensure you follow the established patterns and conventions.