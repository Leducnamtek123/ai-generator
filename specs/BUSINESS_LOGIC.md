# NavLinx Business Logic & Domain Rules (Living Document)

> **Single Source of Truth**: This document defines the core business rules, domain entities, and state transitions for the NavLinx platform. All Frontend (UI) -> Backend (API) integrations MUST adhere to these definitions.

## 1. Domain Entities & Schemas

### 1.1. User (Identity)
- **Source**: Custom Auth (NestJS).
- **Frontend Model**: `useAuth()` store.
- **Backend Model**: `User` Entity (Postgres).
- **Key Fields**:
    - `email`: Unique Identifier.
    - `role`: `user` | `admin`.
    - `status`: `active` | `inactive` (email pending).

### 1.2. Project (Workspace)
- **Concept**: A folder containing Workflows and Assets.
- **Rules**:
    - Default Project: "General" (Created auto on signup).
    - Deletion: Cascade soft-delete.

### 1.3. Workflow (The "Graph")
- **Concept**: A visual node editor saved as JSON.
- **Schema (JSONB)**:
    ```json
    {
      "nodes": [{ "id": "1", "type": "image-gen", "data": { "prompt": "..." } }],
      "edges": [{ "source": "1", "target": "2" }]
    }
    ```
- **Sync**: FE is master for Layout. BE is master for Execution Status.

### 1.4. CreditTransaction (The "Ledger")
- **Concept**: Immutable record of money/credits key.
- **Transaction Types**:
    - `GENERATION`: Negative amount.
    - `TOPUP`: Positive amount (Stripe).
    - `REFUND`: Positive amount (Failed job compensation).
    - `BONUS`: Positive amount (Daily login).

### 1.5. Template (Knowledge Base)
- **Concept**: Pre-configured Workflow or Prompt setup.
- **Fields**:
    - `type`: `workflow` | `prompt` | `style`.
    - `author`: System or User.
    - `visibility`: `public` | `private`.
    - `usageCount`: Metric for sorting.

### 1.6. Community & Sharing
- **Concept**: Social aspect of the platform.
- **Entities**:
    - `SharedProject`: Forkable project copies.
    - `Like`/`Bookmark`: User engagement.
- **Rules**:
    - Forking duplicates the Workflow graph but NOT the execution history.

### 1.7. Stock Assets
- **Concept**: Integrated asset library (Unsplash, Pexels, etc.).
- **Integration**: Proxy API to external providers.

### 1.8. Ecosystem Connectivity (The "Flow")
- **Concept**: Tools, Workflows, and Community content are interconnected.
- **Recreate / Remix Mechanism**:
    - **Trigger**: "Recreate" button on Community/History item.
    - **Action**:
        1. Fetch original `Workflow` graph or `Generation` metadata.
        2. Create NEW `Workflow` / Studio Session.
        3. Pre-fill with original parameters (Prompt, Model, Seed).
        4. Redirect user to Editor.
- **Goal**: Zero-friction transition from Inspiration (Community) to Creation (Studio).

---

## 2. Critical Workflows (Flowcharts)

### 2.1. Authentication Flow
1. **User**: Enters Email/Pass on `/sign-in`.
2. **FE**: Calls `POST /auth/email/login`.
3. **BE**: Validates hash -> Generates JWT + Refresh Token -> Returns `User` object.
4. **FE**: Saves Tokens to `Cookies` (Secure) or `LocalStorage`. Updates `useAuth` store. Redirects to `/dashboard`.

### 2.2. "Generate Image" (Studio)
1. **FE**: User clicks "Generate".
2. **FE**: Checks `params` (Prompt, Model, Size).
3. **FE**: Calls `POST /generate/image`.
4. **BE (Sync)**:
    - Checks Credit Balance (> Cost?).
    - Creates `CreditTransaction` (Hold).
    - Adds Job to Redis Queue.
    - Returns `jobId`.
5. **FE**: Shows "Queued" state on UI card.
6. **BE (Worker)**:
    - Calls Leonardo API.
    - On Success: Uploads to S3 -> Creates `Asset` -> Updates Job Status.
    - On Fail: Refunds Credit -> Updates Job Status.
7. **FE**: Polls `GET /jobs/:id` or waits for WS -> Displays Image.

---

## 3. Architecture & Standards

### Frontend (The Face)
- **Do Not Touch**: UI Layouts, Animations, Tailwind Classes.
- **Responsibility**: Display Data, Capture Input, Optimistic Updates.
- **State**: Server State (TanStack Query) + Client State (Zustand).

### Backend (The Brain)
- **Responsibility**: Validation, orchestration, persistent storage.
- **Pattern**: Hexagonal (Adapters -> Service -> Domain).
- **Security**: Never trust the FE inputs. Validate everything via DTOs.
