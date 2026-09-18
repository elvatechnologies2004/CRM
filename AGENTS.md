<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## FinloNexa Admin Sync Rule

Whenever a user-facing CRM feature or module is added, removed, renamed, archived, or significantly changed, review the Admin Panel in the same change. Add an Admin navigation item only when administrators genuinely need a separate management or monitoring surface. Keep internal workflow capabilities inside their parent Lead or Opportunity admin views instead of creating unnecessary sidebar modules. Do not modify Admin Overview unless the task explicitly requests an Overview change.
