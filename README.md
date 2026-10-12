# ProjectFlow — Collaborative Project Management Simulator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-15%20Passed-brightgreen.svg)]()

**ProjectFlow** is a full-stack web application that simulates a real-world Agile software development team's workflow. Built for academic viva examinations, practical demonstrations, and real-world team collaboration, it provides an end-to-end simulation of Agile requirements formulation, Kanban execution, QA bug tracking, role-based authorization, and sprint velocity reporting.

The primary showcase project seeded out-of-the-box is an **Online Food Delivery System (OFD)**.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Technology Stack](#-technology-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Quick Start & Installation](#-quick-start--installation)
5. [Demo Personas & Viva Login](#-demo-personas--viva-login)
6. [PostgreSQL & Database Setup](#-postgresql--database-setup)
7. [Running Automated Tests](#-running-automated-tests)
8. [Module Details](#-module-details)
9. [Viva Examination Q&A Guide](#-viva-examination-qa-guide)

---

## 🌟 Core Features

* **Agile User Stories Backlog**: Formulate user stories using the standard template: *"As a [role], I want [feature], so that [benefit]"*. Includes Fibonacci story point estimation (1, 2, 3, 5, 8, 13) and dynamic acceptance criteria checklists.
* **Interactive 4-Column Kanban Board**: Columns for **To Do**, **In Progress**, **Testing**, and **Done**. Smooth HTML5 drag-and-drop with instant optimistic updates, server persistence, and rollback on network failure.
* **Issue & Bug Lifecycle Tracking**: Formal bug reporting with reproduction steps, expected vs. actual behavior, severity/priority tags, and role-enforced QA verification transitions (`Open → In Progress → Fixed → Closed`).
* **Personal Work Dashboard ("My Tasks")**: Filtered view for individual assignees displaying overdue alerts and tasks due within 3 days.
* **Role-Based Access Control (RBAC)**: Distinct permissions for **Admin**, **Project Manager**, **Developer**, and **QA Tester** enforced at the database and API layer.
* **Sprint Analytics & Reporting**: Real-time charts powered by Recharts (Status distributions, defect priority breakdown, workload balance, and completion percentages) with **1-click CSV export**.
* **Audit Trail & Activity Log**: Unified activity stream logging task moves, issue creations, comments, and project updates.
* **Cross-Entity Global Search**: Universal search modal (`Ctrl+K`) for projects, tasks, stories, issues, and team members.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6 |
| **Backend** | Node.js, Express.js, TypeScript, Zod, bcryptjs, jsonwebtoken |
| **Database** | Prisma ORM, PostgreSQL (Production Ready), SQLite (Zero-Config Dev Fallback) |
| **Testing** | Vitest, Supertest integration suite |
| **DevOps** | Monorepo workspaces (`client`, `server`), concurrently |

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    Client["React 18 + Vite (Port 5173)\nTailwind CSS / Lucide / Recharts"]
    Proxy["Vite Dev Reverse Proxy (/api)"]
    Server["Express.js REST API (Port 5000)\nTypeScript / Zod / JWT"]
    RBAC["RBAC Middleware\nAdmin | PM | Dev | Tester"]
    Prisma["Prisma ORM Client"]
    DB[("Database\nPostgreSQL / SQLite")]

    Client -->|HTTP / JSON| Proxy
    Proxy -->|Forward| Server
    Server --> RBAC
    RBAC --> Prisma
    Prisma --> DB
```

---

## 🚀 Quick Start & Installation

### Prerequisites
* Node.js v18+ (tested on Node v20/v24)
* npm v9+

### 1. Install Dependencies
In the root directory, install all workspace packages:
```bash
npm install
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(A default `.env` and `server/.env` are already preconfigured for instant execution)*.

### 3. Initialize & Seed the Database
Push the schema to the database and populate the Online Food Delivery System dataset:
```bash
# Push database tables
npm run db:push

# Seed sample users, projects, stories, tasks, and bugs
npm run db:seed
```

### 4. Start the Application
Run both the frontend and backend concurrently with a single command:
```bash
npm run dev
```

* **Frontend Web App**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`
* **Health Check**: `http://localhost:5000/api/health`

---

## 🎓 Demo Personas & Viva Login

The application includes **1-click demo role fill buttons** on the login page (`/login`) for viva examinations:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@projectflow.dev` | `Password123!` | Full workspace administration, member control, delete privileges |
| **Project Manager** | `pm@projectflow.dev` | `Password123!` | Create/edit projects, stories, tasks, sprint planning |
| **Developer** | `dev@projectflow.dev` | `Password123!` | Move Kanban cards, update status, add comments, report bugs |
| **QA Tester** | `tester@projectflow.dev` | `Password123!` | Report bugs with reproduction steps, verify and close fixed bugs |

---

## 🐘 PostgreSQL & Database Setup

By default, the application runs out of the box using a local SQLite file (`dev.db`) through Prisma so that evaluators can run the simulator without configuring external databases.

To connect to a **PostgreSQL** instance:

1. Update `DATABASE_URL` in `.env` and `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/projectflow?schema=public"
   ```
2. Push the PostgreSQL schema:
   ```bash
   npm run db:postgres:push
   ```
3. Seed the PostgreSQL database:
   ```bash
   npm run db:seed
   ```

---

## 🧪 Running Automated Tests

ProjectFlow includes a comprehensive integration test suite covering authentication, RBAC authorization guards, project creation, task movements, and analytics calculations.

To run the tests:
```bash
npm run test
```

**Test Coverage Summary**:
* `POST /api/auth/login` (Admin and Developer JWT generation)
* `GET /api/auth/me` (Profile verification)
* `POST /api/auth/register` (Duplicate email rejection)
* `GET /api/projects` (Unauthorized 401 guard check)
* `POST /api/projects` (Unique key constraint check)
* `POST /api/stories/project/:id` (User story creation)
* `POST /api/tasks/project/:id` (Kanban task creation)
* `PATCH /api/tasks/:id/status` (Drag-and-drop status persistence)
* `POST /api/issues/project/:id` (Bug reporting with reproduction steps)
* `PATCH /api/issues/:id/status` (Role-based closure: developers blocked, QA allowed)
* `POST /api/comments` (Comment thread dispatch)
* `GET /api/analytics/overview` (Real metric calculation)

---

## 📦 Module Details

### 1. User Stories Module (`/stories`)
* Formulate stories using INVEST principles.
* Includes acceptance criteria checklist builder.
* Statuses: `Backlog` → `Ready` → `In Progress` → `In Review` → `Done`.
* Fibonnaci point estimations: 1, 2, 3, 5, 8, 13.

### 2. Kanban Board (`/kanban`)
* Visual 4-column flow: `To Do` → `In Progress` → `Testing` → `Done`.
* Visual indicators: priority badges, story points, due dates, comment counters, linked issue flags.
* Full detail drawer with comment discussions and linked bug status.

### 3. Issue & Bug Tracker (`/issues`)
* Classifications: `Bug`, `Task`, `Improvement`, `Feature Request`.
* Reproduction report: reproduction steps, expected behavior, actual behavior.
* Lifecycle workflow: `Open` → `In Progress` → `Fixed` → `Closed`.
* Developer restrictions: developers can resolve to `Fixed`, but only `Tester`, `Project Manager`, or `Admin` can verify and move to `Closed`.

### 4. Reports & Analytics (`/reports`)
* Workload distribution across team members.
* Story points velocity breakdown.
* **1-Click CSV Exports** for Tasks, Issues, and User Stories.

---

## 💡 Viva Examination Q&A Guide

### Q1: What is the difference between a User Story and a Task?
> **Answer**: A **User Story** captures functional value from an end-user's perspective (*"As a customer, I want to search restaurants..."*), scoped with acceptance criteria and estimated in story points. A **Task** represents granular technical engineering work (e.g., *"Build indexed search queries in backend"*), decomposed from the user story and tracked on the Kanban board.

### Q2: How does ProjectFlow enforce Role-Based Access Control (RBAC)?
> **Answer**: Authorization is enforced on the server in `server/src/middleware/auth.ts` using the `requireRole(['ADMIN', 'PROJECT_MANAGER'])` guard. Even if a user bypasses frontend UI controls, server endpoints reject unauthorized requests with HTTP `403 Forbidden`. For example, a Developer attempting to mark an issue as `CLOSED` is blocked by the status transition check.

### Q3: Why use Prisma ORM instead of raw SQL queries?
> **Answer**: Prisma provides compile-time type safety, automated migrations, parameterized queries preventing SQL injection, and unified database schema modeling across both SQLite (local development) and PostgreSQL (production).

### Q4: How is optimistic UI updating implemented in the Kanban board?
> **Answer**: When a card is dragged to a new column, the frontend immediately moves the card in local React state for a responsive feel, while asynchronously issuing a `PATCH /api/tasks/:id/status` request. If the backend request fails (e.g., network error), the frontend catches the error, displays an alert, and rolls the card back to its previous position.

---

## 👥 Contributors & Acknowledgements
Built for the **Open Source Technologies (OST) Practical 10 Examination** — Collaborative Project Management Simulator.
