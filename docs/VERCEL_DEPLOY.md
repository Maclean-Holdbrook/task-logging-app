# Vercel Deployment

## Deploy Order

1. Deploy the backend from `backend/`
2. Copy the deployed backend URL
3. Deploy the frontend from the repository root
4. Set the frontend API base URL to the backend URL
5. Update the backend allowed frontend origins with the deployed frontend URL

## Frontend Project

Project root:

```text
taskk/
```

Use:

- `vercel.json` in the repository root
- `VITE_API_BASE_URL=https://your-backend-project.vercel.app/api`

## Backend Project

Project root:

```text
taskk/backend/
```

Use:

- `backend/vercel.json`
- endpoint base: `https://your-backend-project.vercel.app`
- API base: `https://your-backend-project.vercel.app/api`
- MCP endpoint: `https://your-backend-project.vercel.app/mcp`

Required backend environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN`

Example `FRONTEND_ORIGIN`:

```text
https://your-frontend-project.vercel.app,https://your-preview-frontend.vercel.app
```

## Hosted MCP Agent

After backend deployment, point the AI agent to:

```json
{
  "mcpServers": {
    "taskk": {
      "transport": "streamable_http",
      "url": "https://your-backend-project.vercel.app/mcp"
    }
  }
}
```

## Checks After Deployment

Backend:

- `GET /api/health`
- `POST /mcp` initialize request works

Frontend:

- can load tasks
- can create tasks
- can delete tasks by completing them

MCP:

- tool list works
- `create_task` works
- `complete_task` removes the task from Supabase
