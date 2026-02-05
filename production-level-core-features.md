# Task: Production Level Core Features

## Status
Status: 🔄 In Progress
Priority: High
Owner: Antigravity

## Context
The project is currently using "demo" logic in several places:
1. Hard-coded UUIDs in the frontend for project IDs.
2. Synchronous, fake execution in the `WorkflowEngine`.
3. Lack of automatic "Physical" workspace (Default Project) for new users.

## Strategic Questions (Passed)
1. **Hard-coding**: Identified central points (Workflow Store, Engine Processors).
2. **Infrastructure**: Redis/BullMQ is preferred for scale.
3. **Domain**: Hexagonal architecture is established but bypasses are happening for speed.

## Proposed Changes

### 1. Unified Project & Context Management
- [ ] **BE**: Implement `createDefaultProject` logic in `UsersService` or `AuthService`.
- [ ] **FE**: Update `useWorkflowStore` to fetch the first available project ID if none is provided.
- [ ] **BE**: Enforce logical separation: every workflow *must* belong to a project, and every project *must* have an owner.

### 2. BullMQ Integration (The "Brain" Foundation)
- [ ] **BE**: Add `@nestjs/bullmq` and `bullmq` dependencies.
- [ ] **BE**: Create `WorkflowsModule` BullMQ producer.
- [ ] **BE**: Implement `WorkflowProcessor` as a Consumer.
- [ ] **BE**: Refactor `WorkflowEngine` to return a `jobId` immediately and process node-by-node in the worker.

### 3. Identity & Google Login
- [ ] **BE**: Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`.
- [ ] **FE**: Configure `GoogleProvider` in `src/auth.ts`.
- [ ] **FE**: Implement backend token exchange in `auth.ts` callbacks (Google idToken -> Backend JWT).
- [ ] **FE**: Wire up Google Login button in `SignInPage`.

### 4. Production Polish
- [ ] **BE**: Implement actual validation for the Workflow JSON graph (using Class-Validator/Zod).
- [ ] **BE**: Secure all `@Get('/workflows')` endpoints to strictly return the current user's data.
- [ ] **BE**: Ensure CORS is correctly configured for the production domain.

## Verification Criteria
- [ ] `npm run build` succeeds on both FE and BE.
- [ ] Creating a "New Studio" in the frontend correctly saves to DB with a real ID.
- [ ] Executing a workflow creates a real job in Redis (verified via log).
- [ ] Workflow mini-previews update correctly after saving.
