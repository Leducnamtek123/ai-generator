# API-Driven Management List Rules
Version: 1.0  
Scope: Admin / Back-office / Management UI  
Principle: Backend is the single source of truth

---

## 0. Core Principle

- Frontend does not infer business logic.
- Backend owns data, rules, permissions, and state validity.
- Every UI interaction must map to an explicit API contract.
- View changes never change data meaning.

---

## 1. View Mode Rules (Grid / Table / List)

- A management list must support multiple view modes when data has both metadata and visual attributes.
- View mode only affects presentation, never query, data scope, or permissions.
- Switching view must not reset search, filter, sort, pagination, or selection.
- Backend must not branch logic by view mode.

---

## 2. Data Fetching & Query Contract

- All list data must be fetched via server-side queries.
- No client-side filtering, sorting, or pagination is allowed.
- Query parameters must be explicit, predictable, and serializable.
- Backend must support search, filter, sort, and pagination as first-class features.

---

## 3. Filter Rules (Backend-Driven)

- Every filter in UI must map 1–1 to a backend-supported filter field.
- No filter option may be hard-coded in frontend.
- Filter configuration and values must be fetched from API.
- Status, type, ownership, and date filters are business data and must be backend-owned.
- Filters must be additive and composable.

---

## 4. Search Rules

- Search must always be executed on the server.
- Frontend must not filter fetched data by text.
- Search scope and behavior are defined by backend.
- Search state must persist across view switches and pagination.

---

## 5. Pagination Rules

- Pagination must always be server-side.
- Frontend must not simulate pagination.
- Pagination state must be stable and reproducible.
- Backend must return total count and paging metadata.

---

## 6. Selection & Bulk Selection Rules

- Selection state must be ID-based, never index-based.
- Header checkbox must support unchecked, checked, and indeterminate states.
- “Select all” must be explicit and scoped.
- Selecting all visible items is different from selecting all items matching current filters.
- Frontend must not assume dataset size or selection scope.

---

## 7. Bulk Action Rules (API-First)

- Bulk actions must be executed via backend APIs.
- Frontend must never send full entity objects for bulk operations.
- Backend must validate permissions, state, and action compatibility.
- Bulk actions must operate on explicit IDs or filter-based scopes.
- Bulk action availability must be driven by backend capability data.

---

## 8. Toolbar & Action Hierarchy

- Management pages must have a single, consistent toolbar.
- Toolbar order must follow:
  Search → Filter → View Mode → Bulk Actions
- Bulk actions must appear only when selection exists.
- Toolbar must not depend on specific view modes.

---

## 9. State Consistency & Persistence

- Search, filter, sort, pagination, view mode, and selection are independent states.
- State must persist across reloads and internal navigation.
- All list states must be serializable (URL or shared state).
- Reloading the page must reproduce the same result set.

---

## 10. Metadata & Counts

- Backend must return metadata for list responses.
- Counts used in UI must come from backend.
- Frontend must not compute business-related counts.
- Filter-related counts must be backend-calculated.

---

## 11. Permissions & Capabilities

- Backend must define which actions are allowed per entity or selection.
- Frontend must not infer permissions or action validity.
- UI must reflect backend-provided capabilities only.

---

## 12. Error & Empty State Rules

- Backend must provide explicit reasons for empty states when applicable.
- Frontend must not guess why data is empty.
- Error handling must be consistent across all view modes.

---

## 13. Scalability & Future-Proofing

- UI and API design must not rely on current data size or status count.
- New filters, statuses, or actions must not require UI refactor.
- View modes must be extendable without backend changes.

---

## 14. Naming & Ownership

- This document defines the contract between frontend and backend.
- UI components implement, but do not redefine, these rules.
- Violations indicate architectural issues, not UI bugs.

---

## 15. Canonical Naming

This architecture may be referred to as:
- API-Driven Management UI
- Backend-First Admin Architecture
- Contract-Based List Management
- Server-Authoritative Admin UI

---

## 16. Guiding Statement

Design all management list pages as backend-authoritative systems.  
Frontend renders state; backend defines truth.
