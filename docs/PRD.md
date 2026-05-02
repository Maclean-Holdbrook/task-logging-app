# Task Logging Web App PRD

## 1. Project Overview

**Project name:** Taskk  
**Product type:** Web application  
**Primary goal:** Build a task logging app with a separate frontend and backend, where the frontend communicates with the backend through an API, the backend integrates MCP capabilities, and Supabase is used as the database and auth/data platform.

This PRD reflects the current workspace as the frontend application with a dedicated `backend/` folder inside the same workspace for the API and MCP service.

```text
taskk/
  src/
  public/
  docs/
  backend/
    src/
    mcp/
```

## 2. Product Vision

The app should let users create, organize, update, and review task logs with a clean interface and a reliable backend. The system should support future automation through MCP so external tools or agents can interact with the backend safely.

## 3. Core Objectives

1. Keep this repository as the frontend application.
2. Create a dedicated `backend/` application that exposes REST-style API endpoints.
3. Use Supabase as the primary database layer.
4. Add MCP support in the backend so the system can be extended for tool-based workflows.
5. Keep the architecture simple enough for incremental delivery.

## 4. Users and Use Cases

### Primary user

- Individual user logging personal or work tasks.

### Core use cases

- User creates a task log entry.
- User views all task logs.
- User filters logs by status, date, or category.
- User updates a task log.
- User marks a task as completed.
- User deletes a task log.
- User optionally signs in to access private task data.
- MCP clients query or create task logs through backend tools.

## 5. Functional Requirements

### Frontend

- Built as a SPA.
- Connects to backend via HTTP API.
- Screens:
  - Dashboard
  - Task list
  - Task creation form
  - Task detail/edit view
  - Authentication screens if auth is enabled
- Features:
  - Create task
  - Read tasks
  - Update task
  - Delete task
  - Mark complete/incomplete
  - Filter and sort tasks
  - Loading and error states

### Backend

- Dedicated `backend/` folder and application.
- Exposes API endpoints for task operations.
- Handles validation, business rules, and persistence.
- Connects to Supabase.
- Provides MCP server/tool interface for task operations.
- Enforces auth/authorization rules if user accounts are enabled.

### Task entity

Minimum fields:

- `id`
- `title`
- `description`
- `status`
- `priority`
- `category`
- `created_at`
- `updated_at`
- `due_date`
- `user_id`

Suggested `status` values:

- `pending`
- `in_progress`
- `completed`
- `archived`

Suggested `priority` values:

- `low`
- `medium`
- `high`

## 6. Non-Functional Requirements

- Clear separation between frontend and backend.
- API-first communication model.
- Maintainable folder structure.
- Basic input validation on frontend and backend.
- Secure environment variable handling.
- Reasonable performance for standard CRUD usage.
- Scalable enough for future features such as analytics, reminders, and collaboration.

## 7. Proposed Architecture

### Frontend

- Framework: React with Vite
- Responsibility:
  - UI rendering
  - Form handling
  - API calls
  - State management
  - User session handling

### Backend

- Runtime: Node.js
- Responsibility:
  - API routes
  - Task validation
  - Supabase integration
  - MCP tool exposure
  - Auth middleware if needed

### Database

- Platform: Supabase
- Responsibility:
  - Task storage
  - User records if auth is enabled
  - Row-level security where appropriate

## 8. API Requirements

Base example:

```text
/api/tasks
```

Suggested endpoints:

- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

Optional auth endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

API expectations:

- JSON request/response format
- Standard success and error payloads
- Validation errors returned clearly
- Authentication support if private task logs are required

## 9. MCP Requirements

The backend should include MCP support so external clients can interact with task data through defined tools.

Suggested MCP tools:

- `list_tasks`
- `get_task`
- `create_task`
- `update_task`
- `delete_task`
- `complete_task`

MCP expectations:

- Tool inputs validated before database writes
- Tool responses map cleanly to backend task models
- Sensitive operations respect authentication and authorization rules
- MCP implementation stays isolated from core route/controller logic where possible

### MCP Agent Configuration

The personal AI agent can connect to the backend MCP server in two modes:

1. Local development mode using a local MCP process
2. Hosted production mode using the remote MCP HTTP endpoint

### Local MCP Mode

Required command:

```text
npm run mcp
```

Required working directory:

```text
taskk/backend
```

Agent setup steps:

1. Install backend dependencies in `backend/`.
2. Ensure `backend/.env` contains valid Supabase credentials.
3. Configure the AI agent's MCP client to launch `npm run mcp` from `backend/`.
4. Confirm the agent can discover these tools:
   - `list_tasks`
   - `get_task`
   - `create_task`
   - `update_task`
   - `delete_task`
   - `complete_task`
5. Test the agent with a simple `create_task` call.

Example MCP client shape:

```json
{
  "mcpServers": {
    "taskk": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "C:\\Users\\ebene\\Desktop\\Projects\\taskk\\backend"
    }
  }
}
```

### Hosted MCP Mode

When the backend is deployed, the AI agent should connect to the remote MCP endpoint:

```text
https://<your-backend-domain>/mcp
```

Hosted MCP setup steps:

1. Deploy the backend project.
2. Confirm the `/mcp` endpoint is reachable.
3. Keep Supabase credentials configured in the deployed backend.
4. Configure the AI agent to use MCP over HTTP instead of launching a local process.
5. Verify the agent can list tools and call `create_task`.

Example hosted MCP client shape:

```json
{
  "mcpServers": {
    "taskk": {
      "transport": "streamable_http",
      "url": "https://your-backend-domain.vercel.app/mcp"
    }
  }
}
```

Important deployment notes:

- This project now supports both local `stdio` MCP and hosted MCP over HTTP.
- The hosted MCP endpoint is separate from the REST API endpoints under `/api`.
- Local development can keep using `npm run mcp`.
- Production agents should use the hosted `/mcp` endpoint.

### Vercel Deployment Notes

Frontend deployment:

- Deploy the repository root as the frontend project.
- Use the root `vercel.json` for SPA rewrites.
- Set `VITE_API_BASE_URL` in Vercel to the deployed backend API base URL.

Backend deployment:

- Deploy `backend/` as a separate Vercel project.
- Use `backend/vercel.json` so both `/api/*` and `/mcp` resolve to `backend/api/index.js`.
- Add these environment variables in the backend Vercel project:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `FRONTEND_ORIGIN`
- The backend HTTP API is deployable on Vercel.
- The hosted MCP endpoint is also exposed by the backend deployment at `/mcp`.
- The local stdio MCP server remains available for local agent workflows.

## 10. Supabase Requirements

Supabase should be used for:

- Database tables
- Authentication if enabled
- Row-level security
- API credentials via environment variables

Suggested initial table:

### `tasks`

- `id` UUID primary key
- `user_id` UUID nullable or required based on auth model
- `title` text not null
- `description` text
- `status` text not null default `pending`
- `priority` text not null default `medium`
- `category` text
- `due_date` timestamptz nullable
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

Suggested Supabase rules:

- Users can only read and modify their own tasks.
- Anonymous access should be disabled unless explicitly needed.

## 11. Folder Structure Target

```text
taskk/
  src/
  public/
  package.json
  docs/
    PRD.md
  backend/
    src/
    package.json
    mcp/
```

## 12. Delivery Phases

### Phase 1: Project Setup

- Keep existing Vite app in this repository as the frontend
- Initialize backend project in `backend/`
- Add shared documentation and environment examples

### Phase 2: Backend Foundation

- Set up server
- Add API routing
- Add request validation
- Add error handling
- Connect backend to Supabase

### Phase 3: Database Design

- Create Supabase project
- Create `tasks` table
- Configure policies
- Add migration or schema documentation

### Phase 4: Frontend Foundation

- Build app shell
- Add routing
- Add API service layer
- Add task list and task form views

### Phase 5: Task CRUD

- Create task
- View task list
- View task details
- Update task
- Delete task
- Change task status

### Phase 6: MCP Integration

- Add MCP server setup in backend
- Expose task management tools
- Validate MCP inputs and outputs
- Test MCP-backed workflows

### Phase 7: Auth and Security

- Add auth flow if required
- Protect API endpoints
- Enforce Supabase RLS
- Secure environment variables

### Phase 8: QA and Deployment

- Add tests
- Verify frontend-backend integration
- Verify Supabase connectivity
- Verify MCP connectivity
- Prepare deployment configs
- Prepare Vercel deployment for frontend and backend API
- Keep MCP agent configuration documented separately from Vercel hosting

## 13. Completion Checklist

Use these checkboxes to track execution phase by phase.

### Project Tracking

- [x] Phase 1 complete: Frontend confirmed and backend folder initialized
- [x] Phase 2 complete: Backend foundation
- [ ] Phase 3 complete: Supabase schema and policies
- [ ] Phase 4 complete: Frontend foundation
- [ ] Phase 5 complete: Task CRUD end to end
- [x] Phase 6 complete: MCP integration
- [ ] Phase 7 complete: Auth and security
- [ ] Phase 8 complete: QA and deployment prep

### Frontend Checklist

- [x] Frontend scope of this repository confirmed
- [ ] Routing configured
- [x] API client configured
- [x] Dashboard page created
- [x] Task list page created
- [x] Task create form created
- [x] Task edit flow created
- [x] Error/loading states implemented

### Backend Checklist

- [x] Backend created in `backend/`
- [x] Server bootstrapped
- [x] Task routes created
- [x] Controllers/services created
- [x] Validation added
- [x] Error handling added
- [x] Supabase client connected

### Supabase Checklist

- [x] Supabase project created
- [x] Environment variables documented
- [x] `tasks` table created
- [ ] RLS policies created
- [ ] Auth strategy decided

### MCP Checklist

- [x] MCP server initialized
- [x] `list_tasks` tool added
- [x] `get_task` tool added
- [x] `create_task` tool added
- [x] `update_task` tool added
- [x] `delete_task` tool added
- [x] `complete_task` tool added
- [x] MCP agent configuration documented
- [x] MCP tools tested

## 14. Success Criteria

- User can create, view, update, and delete task logs from the frontend.
- Frontend communicates successfully with backend API.
- Backend persists task data in Supabase.
- MCP tools can perform core task operations safely.
- The frontend and backend exist as separate applications within the workspace and communicate through the API.

## 15. Open Decisions

- Should auth be mandatory from the first version or added after CRUD is stable?
- Should the backend use Express, Fastify, or another Node server framework?
- Should the API be REST-only, or should realtime Supabase features be added later?
- Should task categories and priorities be fixed enums or user-defined?
