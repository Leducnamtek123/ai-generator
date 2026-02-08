DATA KEY GOVERNANCE RULES
1. Nguyên tắc tối thượng (Golden Rule)

Mọi entity render trong UI BẮT BUỘC dùng id duy nhất từ backend làm key.

id phải:

Duy nhất

Bất biến trong vòng đời entity

UI không được tự sinh key

2. Nguồn key hợp lệ
ĐƯỢC PHÉP

id / uuid / ulid từ backend

Composite id đã được backend định nghĩa rõ

KHÔNG ĐƯỢC PHÉP

❌ index của array

❌ name / title / email

❌ string ghép tạm (name-index)

❌ key tăng dần ở frontend

❌ random / nanoid sinh tại UI

Rule text:

UI key must come from persisted backend identity.

3. Áp dụng bắt buộc cho các khu vực có data
List / Table / Grid

Mỗi row:

key = entity.id

Sorting / filtering:

Không làm thay đổi key

Kanban

Card:

key = candidate.id

Drag & drop:

Dùng id để identify source / target

Không dùng index cho sortable context

Tree / Nested Data

Mỗi node:

key = id thực

Không dùng path text làm key

4. State & Cache Rules (rất quan trọng)

Mọi state map theo:

Record<ID, Entity>

Không map theo name hoặc position

Rule text:

Entity identity must be decoupled from presentation order.

5. Performance & Re-render Rules

Key sai → React:

Re-mount component

Mất state

Lag drag & drop

Rule text:

Stable keys are mandatory for performance-critical views.

6. API Contract Rules

Mọi API trả về list bắt buộc phải có id

Không có id → API bị coi là invalid

Rule text:

Frontend is not allowed to render entities without backend-provided IDs.

7. Error Handling Rules

Nếu thiếu id:

Block render

Log error

Hiển thị fallback state

Rule text:

Missing IDs must fail fast, not silently degrade.

8. Anti-patterns (CẤM TUYỆT ĐỐI)

❌ key={index}

❌ key={name}

❌ key={\${name}-${i}`}`

❌ Tự sinh key trong component

❌ Key thay đổi khi sort / filter

9. Acceptance Checklist

Một view đạt chuẩn khi:

Reorder không remount

Drag & drop mượt

State không reset ngẫu nhiên

Virtualization hoạt động đúng