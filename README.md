# BM Sydney Dynamic Project Roadmap — v2

Static website designed for GitHub Pages.

## New in v2
- True hierarchy: **Category → Task → Subtask**
- Add Task and Add Subtask buttons
- Subtasks select a Parent Task
- Each subtask can have its own:
  - predecessor(s)
  - duration
  - owner
  - colour
  - Gantt bar
- Parent tasks can be marked **Summary**
  - summary tasks automatically span from the earliest subtask start to latest subtask finish
  - summary bars are drawn as an outline
- Gantt recalculates automatically
- Browser persistence using localStorage
- JSON import/export
- Print/PDF support
- No build step or backend required

## Files
- `index.html`
- `styles.css`
- `app.js`

## Publish to GitHub Pages
1. Create a GitHub repository, e.g. `bm-sydney-roadmap`.
2. Upload the three files above to the repository root.
3. Open the repository **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the default branch (usually `main`) and `/ (root)`.
6. Save.
7. GitHub will publish a URL similar to:
   `https://YOUR-USERNAME.github.io/bm-sydney-roadmap/`

## Custom domain
You can connect a domain/subdomain later from **Settings → Pages → Custom domain**.

## Data storage
Edits are saved only in the current browser/device using `localStorage`.
Use **Export JSON** for backup and **Import JSON** to move the schedule to another device.

For shared editing between multiple BM Sydney staff, add a shared database/backend later.
