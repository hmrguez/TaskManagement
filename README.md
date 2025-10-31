# Task Management — .NET 9 + Angular

A full‑stack take‑home project: a simple, secure task manager built with ASP.NET Core 9 (Web API), EF Core, Identity (JWT auth), PostgreSQL, and Angular + Angular Material.

This README gives you an overview, how to run it, and where to find things. It also includes placeholders for UI screenshots.


## Overview

- Authenticate with email + password (JWT Bearer)
- Create, read, and delete personal tasks ("todos")
- Pagination and search on your tasks
- Angular Material UI with responsive layout
- Swagger/OpenAPI for easy API exploration in development


## Tech Stack

- Backend: ASP.NET Core 9, FastEndpoints, EF Core, ASP.NET Identity (JWT)
- Database: PostgreSQL
- Frontend: Angular, Angular Material
- Auth: JWT Bearer tokens (issued on sign‑in / sign‑up)


## Project Structure

```
/TaskManagement.Api           # ASP.NET Core Web API (FastEndpoints, EF Core, Identity, JWT)
/task-management-app          # Angular application (Material UI)
TaskManagement.sln            # Solution file
```

Key backend files:
- `TaskManagement.Api/Program.cs` — app setup, DI, auth, Swagger, CORS, and DB ensure‑created
- `TaskManagement.Api/Features/Auth` — Identity user + auth endpoints (e.g., sign‑up)
- `TaskManagement.Api/Features/Todos` — CRUD endpoints for tasks
- `TaskManagement.Api/Data` — EF Core `ApplicationDbContext`


## Features in a bit more detail

- Authentication and authorization
  - ASP.NET Identity with a custom `User` entity
  - JWT issuance via `IJwtService`
  - Protected endpoints via `Authorization: Bearer <token>`

- Task management
  - Endpoints to list (paged, searchable), get by id, create, and delete tasks
  - Tasks are scoped to the authenticated user


## API Endpoints (selection)

Note: The exact request/response contracts live in the `Features` folders. Explore Swagger in dev to try them out.

- Auth
  - `POST /api/auth/signup` — create a new user account
  - `POST /api/auth/signin` — obtain a JWT (if implemented in the project)

- Todos (require `Authorization: Bearer`)
  - `GET /api/todos?PageNumber=1&PageSize=10&SearchText=foo` — paged list of the current user’s tasks
  - `GET /api/todos/{id}` — get a specific task by id
  - `POST /api/todos` — create a task
  - `DELETE /api/todos/{id}` — delete a task

Use the built‑in Swagger UI in development to discover all available endpoints and their schemas.


## Getting Started

### Prerequisites

- .NET SDK 9.x
- Node.js 20+ and npm (or pnpm) for the Angular app
- PostgreSQL 14+ running locally or accessible via connection string


### 1) Backend — TaskManagement.Api

1. Navigate to the API folder:
   ```bash
   cd TaskManagement.Api
   ```

2. Configure secrets in `appsettings.secret.json` (not committed). Create the file next to `appsettings.json` with:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=task_management;Username=postgres;Password=postgres"
     },
     "Jwt": {
       "Issuer": "TaskManagement.Api",
       "Audience": "TaskManagement.Web",
       "SecretKey": "replace-with-a-long-random-secret"
     }
   }
   ```

   Notes:
   - The API reads this file if present: see `Program.cs` (`AddJsonFile("appsettings.secret.json")`).
   - Ensure the database user has permission to create the DB.

3. Create the database (if it doesn’t exist). The API calls `EnsureCreated()` on startup, which will create the schema. For production, you’d typically use EF Core migrations.

4. Run the API:
   ```bash
   dotnet run
   ```

5. Visit Swagger (development):
   - https://localhost:5001/swagger or http://localhost:5000/swagger (depending on Kestrel ports)


### 2) Frontend — task-management-app (Angular)

1. Navigate to the Angular app:
   ```bash
   cd task-management-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or: pnpm install
   ```

3. Configure environment (if needed):
   - Ensure the API base URL matches your backend (often `http://localhost:5000` or `https://localhost:5001`).
   - Edit the Angular environment file to point to your API URL, e.g. `src/environments/environment.ts` (or wherever the app keeps base URLs).

4. Start the dev server:
   ```bash
   npm start
   # or: ng serve
   ```

5. Open the app in your browser:
   - Usually http://localhost:4200


## Using the App

1. Sign up for a new account.
2. Sign in to receive a JWT; the Angular app stores it and sends it in `Authorization` headers.
3. Create tasks: set a title, description, due date, and completion status.
4. Browse tasks with pagination and search by text.
5. Delete tasks you no longer need.


## Screenshots (placeholders)

Replace the paths below with your actual screenshots when available.

- Landing / Dashboard
  
  ![Landing](docs/images/landing.png)

- Tasks List (with search and pagination)
  
  ![Tasks List](docs/images/tasks-list.png)

- Create / Edit Task Dialog
  
  ![Task Dialog](docs/images/task-dialog.png)

- Sign In / Sign Up
  
  ![Auth](docs/images/auth.png)


## Development Notes

- CORS is enabled with a permissive default policy for local development. Adjust for production.
- JSON serialization uses PascalCase configuration for FastEndpoints.
- In `Program.cs`, Swagger is enabled only in Development.
- The current setup uses `EnsureCreated()` for DB bootstrapping. For teams and CI/CD, consider EF Core migrations.


## Testing

- API: You can add xUnit/NUnit tests for endpoints and services.
- Frontend: Use Angular’s `ng test` for unit tests and `ng e2e` for end‑to‑end tests (if configured).


## Roadmap / Possible Enhancements

- Update endpoints (PUT/PATCH) for tasks
- Soft‑delete or archive tasks
- Sorting by due date/completion
- Labels/tags and filtering
- Role‑based authorization (e.g., admin)
- Refresh tokens and token revocation
- CI/CD pipeline and containerization (Docker Compose for API + DB + Frontend)


## License

This project is provided as part of a take‑home assignment. Choose and add a license if you plan to open‑source it (e.g., MIT).
