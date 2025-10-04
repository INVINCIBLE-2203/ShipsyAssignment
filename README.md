# Collaborative Task Management API

This is a production-ready backend for a collaborative task management and productivity application, built with Node.js, TypeScript, and PostgreSQL.

## Features

- **Multi-tenancy**: Organizations/Workspaces for team collaboration.
- **Core Entities**: Projects, Tasks, Comments, Users.
- **Extensibility**: Custom properties for tasks and projects.
- **Authentication**: JWT-based (Access & Refresh Tokens).
- **Real-time**: @mentions and notifications (scaffolded).
- **Rich API**: Pagination, filtering, sorting for all major endpoints.
- **Security**: Helmet, CORS, rate limiting, class-validator, SQL injection prevention.
- **Containerization**: Full Docker and Docker Compose support.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js (JWT Strategy)
- **Validation**: class-validator, class-transformer
- **API Specification**: OpenAPI 3.0 (via TSOA - to be integrated)
- **Testing**: Jest, Supertest

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- A PostgreSQL client (like DBeaver or pgAdmin)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Environment Configuration

Copy the example environment file and update it with your configuration.

```bash
cp .env.example .env
```

**Key variables to update in `.env`:**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`

### 3. Running with Docker (Recommended)

This is the easiest way to get the entire stack (API + Database) running.

```bash
# Build and start the services in detached mode
docker-compose up -d --build
```

The API will be available at `http://localhost:3000`.

### 4. Running Locally (Without Docker)

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Set up PostgreSQL Database**

    Make sure you have a running PostgreSQL instance and create a database with the name you specified in your `.env` file.

3.  **Run the Application**

    For development with auto-reloading:
    ```bash
    npm run start:dev
    ```

    For production:
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

The API follows RESTful conventions. All endpoints are prefixed with `/api`.

*(A full OpenAPI/Swagger documentation will be generated here)*

- **Authentication**: `/api/auth`
- **Organizations**: `/api/organizations`
- **Projects**: `/api/projects`
- **Tasks**: `/api/tasks`
- **Comments**: `/api/comments`

## Testing

To run the test suite:

```bash
npm test
```

This will execute all unit and integration tests located in the `tests/` directory.

## Project Structure

```
src/
├── config/         # Environment, database, auth configs
├── modules/        # Feature modules (auth, tasks, etc.)
├── common/         # Shared utilities, decorators, middleware
├── database/       # TypeORM entities, migrations, seeds
├── utils/          # General utility functions
└── main.ts         # Application entry point
```

## CI/CD

A basic GitHub Actions workflow is included in `.github/workflows/ci.yml`. It runs tests on every push and pull request to the `main` branch.