# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlideNote is a Chrome sidebar extension for quick, cross-device note-taking. It uses Chrome Storage Sync API for automatic synchronization across devices. The project philosophy is "simplicity above all" - focusing solely on storing and syncing short text fragments.

**Current Status**: Design phase (v0.0.1). Implementation is pending.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (for HTML prototype debugging)
npm run dev

# Build for development (shows "SlideNote Dev" in browser)
npm run build:dev

# Build for production (shows "SlideNote" in browser)
npm run build:prod

# Type checking (JSDoc + TypeScript)
npm run type-check

# Linting
npm run lint
```

### Build Commands Explained

| Command | Display Name | Use Case |
|---------|--------------|----------|
| `npm run build:dev` | SlideNote Dev | Development/testing - can coexist with production version |
| `npm run build:prod` | SlideNote | Production release - for Chrome Web Store and distribution |

## Architecture Overview

### Technology Stack Rationale

The project intentionally avoids frameworks (React/Vue) for:
- **Performance**: Faster load times without ~100KB+ framework overhead
- **Simplicity**: No complex state management needed for basic CRUD
- **Stability**: No framework upgrade risks, code remains viable long-term
- **Control**: Full control over rendering and debugging

### Core Architecture (Planned)

```
src/sidepanel/
├── index.html          # Entry point
├── app.js              # Application initialization
├── styles.css          # Global styles
│
├── core/               # Data layer
│   ├── Store.js        # Chrome Storage API wrapper, state management
│   ├── EventBus.js     # Component communication
│   ├── AutoSaver.js    # Debounced auto-save (1s delay)
│   └── SyncManager.js  # Cross-device sync listener
│
├── components/         # UI components (vanilla JS)
│   ├── Component.js    # Base component class with lifecycle
│   ├── NoteList.js     # Left sidebar note list
│   ├── NoteEditor.js   # Right content editor
│   ├── SearchBar.js    # Search with real-time filtering
│   └── ConfirmDialog.js # Delete confirmation with countdown
│
└── utils/
    ├── dom.js          # DOM helpers
    ├── debounce.js     # Debounce/throttle
    └── icons.js        # Inline SVG icons
```

### Data Flow

1. **User Input** → Component emits event via EventBus
2. **EventBus** → Store methods (createNote, updateNote, deleteNote)
3. **Store** → Chrome Storage Sync API (persists data)
4. **Chrome Storage** → SyncManager detects changes on other devices
5. **SyncManager** → Reloads state, notifies components to refresh

### Storage Design

Chrome Storage Sync API is used with these keys:
- `slidenote_notes`: Array of note objects
- `slidenote_active_id`: Currently selected note ID

Note structure:
```javascript
{
  id: "note_${timestamp}_${random}",
  title: "string",
  content: "string",
  createdAt: number (timestamp),
  updatedAt: number (timestamp)
}
```

**Important Storage Limits:**
- Single item: ~8KB
- Total capacity: ~100KB
- Write frequency: ~1/second (rate-limited)

### Component Communication Pattern

Components do not directly reference each other. All communication flows through the EventBus:

```javascript
// Emit
bus.emit('note:select', noteId);
bus.emit('note:create');
bus.emit('note:delete-request', note);
bus.emit('search:change', query);

// Subscribe
const unsubscribe = bus.on('note:select', (id) => { ... });
```

## Chrome Extension Specifics

### Manifest V3 Configuration

- **Permissions**: Only `storage` (minimal permission)
- **Side Panel**: Uses Chrome 114+ Side Panel API for persistent sidebar
- **Entry Point**: `sidepanel.html` (via manifest side_panel.default_path)

### Debugging

1. **Sidebar DevTools**: Right-click sidebar → "Inspect"
2. **Service Worker**: chrome://extensions/ → "service worker" link
3. **Storage Viewer**: DevTools → Application → Storage → Sync Storage
4. **Sync Testing**: Changes sync across devices in ~10 seconds

## Design System

CSS Variables define the entire design token system (see `docs/versions/v0.0.1/ui-design/prototype.html`):

```css
/* Key tokens */
--color-bg-primary: #ffffff
--color-bg-secondary: #f5f5f5
--color-text-primary: #1a1a1a
--color-primary: #0066cc
--font-size-base: 13px
--spacing-md: 12px
--radius-md: 6px
```

Layout: 480px sidebar width, 180px note list, 300px content area.

## Key Implementation Details

### Auto-Save Behavior

- Edits are debounced by 1 second (AutoSaver.js)
- Merges pending changes before persisting
- Shows "已保存" (Saved) toast on completion

### Delete Confirmation

- 3-second countdown before confirm button becomes clickable
- Prevents accidental deletions
- Auto-selects next note after deletion

### Empty States

Two types handled:
1. **No notes exist**: Show "还没有笔记" in list
2. **No note selected**: Show "选择或创建一条笔记" in editor

## Documentation Structure

- `docs/README.md`: Documentation index
- `docs/versions/v0.0.1/requirements/PRD.md`: Product requirements
- `docs/versions/v0.0.1/tech-design/Tech-Spec.md`: Detailed technical specifications with code examples
- `docs/versions/v0.0.1/ui-design/`: UI specifications and interactive prototype

## Development Workflow

1. Run `npm run dev` for hot-reload development
2. Load unpacked extension in Chrome from `dist/`
3. Click extension icon to open side panel
4. Use DevTools for debugging
5. After changes, rebuild and reload extension in chrome://extensions/

## Principles to Follow

1. **No Framework**: Stick to vanilla ES6+ JavaScript
2. **Minimal Dependencies**: Only Vite for building, TypeScript for type checking
3. **CSS Variables**: Use the defined design tokens, avoid hardcoding values
4. **Component Pattern**: Extend `Component` base class for consistent lifecycle
5. **Event-Driven**: Use EventBus, not direct component references
6. **Storage Awareness**: Respect Chrome Storage limits, implement warnings at 90% capacity
