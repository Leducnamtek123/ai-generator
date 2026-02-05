# NavLinx Master Roadmap

> **Philosophy**: Frontend is the "Face", Backend is the "Brain". All development follows the `specs/BUSINESS_LOGIC.md` as the single source of truth.
> **Status**: Phase 1 (Foundation) - In Progress.

---

## 🏗️ Phase 1: Foundation & Architecture (DONE)
**Goal**: Establish the "Skeleton" of the application.
- [x] **Frontend UI**: 
    - Premium Landing Page (`/`).
    - Dashboard Layout (`/dashboard`).
    - Studio Interface (`/studio`).
    - Workflow Builder (`/workflow`).
- [x] **Backend Infrastructure**:
    - NestJS Monorepo Setup.
    - Docker Compose (Postgres + Redis).
    - Hexagonal Architecture (Domain/Infra separation).
- [x] **Core Models**:
    - User, Project, Workflow, Asset, CreditTransaction.

---

## 🔐 Phase 2: Identity & Persistence (CURRENT)
**Goal**: Make the app "Real". Users can sign up, log in, and save their work.

### 2.1. Authentication System (Custom)
- [ ] **Backend**:
    - [ ] Enable `AuthModule` (JWT, Passport).
    - [ ] Config `MailModule` (AWS SES / Gmail SMTP) for Email Confirmation.
    - [ ] Implement `Refresh Token` rotation logic.
    - [ ] API: `POST /auth/email/register`, `POST /auth/email/login`, `GET /auth/me`.
- [ ] **Frontend**:
    - [ ] Wire up **Sign In** / **Sign Up** forms to API.
    - [ ] Implement `AuthGuard` (Protect `/dashboard` routes).
    - [ ] Auto-redirect to `/login` if session expires.

### 2.2. Project & Asset Management
- [ ] **Backend**:
    - [ ] API: `POST /projects` (Create Workspace).
    - [ ] API: `GET /projects` (List user's projects).
    - [ ] **S3 Integration**: `FilesModule` for uploading images/references.
- [ ] **Frontend**:
    - [ ] **Dashboard**: Fetch and display "Recent Projects".
    - [ ] **Studio**: "Upload Reference Image" -> Calls BE Upload API.

### 2.3. Workflow Persistence
- [ ] **Backend**:
    - [ ] API: `PUT /workflows/:id` (Save full JSON graph).
    - [ ] Validation: Check if `nodes` and `edges` conform to Schema.
- [ ] **Frontend**:
    - [ ] **Workflow Canvas**: "Save" button triggers API call.
    - [ ] **Auto-save**: Debounced save (every 30s).

---

## 🧠 Phase 3: The AI Engine ("The Brain")
**Goal**: Make the app "Smart". Execute workflows and generate content.

### 3.1. Job Queue System
- [ ] **Backend**:
    - [ ] Setup **BullMQ** (Redis) for async job processing.
    - [ ] Create `GenerationQueue` and `WorkflowQueue`.

### 3.2. Studio Generation (Linear)
- [ ] **Backend**:
    - [ ] API: `POST /generate/image` (Single task).
    - [ ] Worker: Integrate **Leonardo.AI** API.
    - [ ] Webhook: Handle "Job Completed" callback from AI Provider.
- [ ] **Frontend**:
    - [ ] **Studio**: "Generate" button -> Calls API -> Shows "Processing" state.
    - [ ] **Result**: Polling/WebSocket to display final image.

### 3.3. Workflow Execution (Graph)
- [ ] **Backend**:
    - [ ] **Execution Engine**: Service that traverses the JSON Graph.
    - [ ] **Node Processors**:
        - `LLMNode` (OpenAI).
        - `ImageGenNode` (Leonardo).
        - `FaceSwapNode` (Replicate).
    - [ ] State Machine: Track status of each Node (`PENDING` -> `RUNNING` -> `COMPLETED`).

---

## 💰 Phase 4: Economy & Scaling
**Goal**: Make the app "Viable". Moneitzation and Performance.

### 4.1. Credit System
- [ ] **Backend**:
    - [ ] **Deduction Logic**: Atomic transactions (Prevent race conditions).
    - [ ] **Cost Matrix**: Define cost per model/resolution.
    - [ ] API: `GET /credits/balance`.
- [ ] **Frontend**:
    - [ ] **Top Bar**: Show Real-time Balance.
    - [ ] **Blocking**: Disable "Generate" button if insufficient funds.

### 4.2. Payments (Stripe)
- [ ] **Backend**:
    - [ ] Stripe Webhook (Handle `checkout.session.completed`).
    - [ ] Top-up credits upon successful payment.

---

## 🌍 Phase 5: Community & Ecosystem (NEW)
**Goal**: Make the app "Social" and "Extensible".

### 5.1. Template System
- [ ] **Backend**: `TemplatesModule` (CRUD for Workflows/Prompts).
- [ ] **Frontend**: `Creative Studio` Grid Integration (Real data).

### 5.2. Community Features
- [ ] **Backend**: Shared Projects, Forking logic, Likes/Bookmarks.
- [ ] **Frontend**: `CommunityPage`, `Shared` tab in Studio.
- [ ] **Interactivity**: **Recreate Flow** (Clone params -> Editor).

### 5.3. Advanced Tools
- [ ] **History**: Activity Logs (`/history` page).
- [ ] **Video**: Advanced Control Panel (`/video` page).
- [ ] **Settings**: User Profile, Preferences, API Keys.


## 🛠️ Governance & Standards
1. **Frontend Integrity**: Never change UI structure without Design Review. Backend adapts to Frontend.
2. **Business Logic First**: Update `specs/BUSINESS_LOGIC.md` BEFORE writing code.
3. **Clean Code**: Hexagonal Architecture on BE. Component Composition on FE.
