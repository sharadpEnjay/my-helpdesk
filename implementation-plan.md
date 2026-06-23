# Implementation Plan

## Phase 1: Project Setup

- [ ] Initialize monorepo structure (`/client`, `/server`)
- [ ] Set up Express server with TypeScript
- [ ] Set up React app with TypeScript
- [ ] Set up PostgreSQL database

## Phase 2: Authentication

- [ ] Create login page
- [ ] Implement login API endpoint
- [ ] Implement session-based authentication middleware
- [ ] Implement logout API endpoint
- [ ] Add route protection on the frontend (redirect to login if unauthenticated)

## Phase 3: User Management

- [ ] Create user management page (admin only)
- [ ] Implement create agent API endpoint
- [ ] Implement list users API endpoint
- [ ] Implement edit user API endpoint
- [ ] Implement delete user API endpoint
- [ ] Add role-based access control (admin vs agent)

## Phase 4: Ticket CRUD

- [ ] Implement create ticket API endpoint
- [ ] Implement list tickets API endpoint (with filtering by status and category, sorting)
- [ ] Implement get ticket API endpoint
- [ ] Implement update ticket API endpoint (change status, assign agent)
- [ ] Create ticket list page with filtering and sorting
- [ ] Create ticket detail page

## Phase 5: CRM Modules CRUD

- [ ] **Account Module**
    - [ ] Create account API endpoint
    - [ ] List accounts API endpoint
    - [ ] Update account API endpoint
    - [ ] Delete account API endpoint
    - [ ] Create simple account list and detail pages
- [ ] **Lead Module**
    - [ ] Create lead API endpoint
    - [ ] List leads API endpoint
    - [ ] Update lead API endpoint
    - [ ] Convert lead to account/contact/opportunity logic
    - [ ] Create lead management UI
- [ ] **Contact Module**
    - [ ] Create contact API endpoint
    - [ ] List contacts API endpoint
    - [ ] Update contact API endpoint
    - [ ] Link contact to account
    - [ ] Contact management UI
- [ ] **Opportunity Module**
    - [ ] Create opportunity API endpoint
    - [ ] List opportunities API endpoint
    - [ ] Update opportunity API endpoint (stages, amounts)
    - [ ] Link opportunity to account/contact

## Phase 6: AI Features


- [ ] Set up Claude API integration
- [ ] Implement auto-classification endpoint (categorize incoming tickets)
- [ ] Implement AI summary endpoint (generate ticket summary)
- [ ] Implement AI suggested reply endpoint
- [ ] Build knowledge base structure and seed with initial content
- [ ] Integrate AI features into ticket detail page UI

## Phase 7: Email Integration


- [ ] Set up email provider (SendGrid/Mailgun)
- [ ] Implement inbound email webhook to create tickets
- [ ] Implement outbound email sending when an agent replies
- [ ] Handle email threading (replies linked to existing tickets)

## Phase 8: Dashboard


- [ ] Create dashboard page with ticket overview stats (open, resolved, closed counts)
- [ ] Add tickets by category breakdown
- [ ] Add recent tickets list
- [ ] Add quick filters to navigate to filtered ticket list

## Phase 9: Polish & Deployment


- [ ] Add input validation and error handling across all endpoints
- [ ] Add loading states and error states on the frontend
- [ ] Write Dockerfile for server and client
- [ ] Set up Docker Compose for local development
- [ ] Write deployment configuration
