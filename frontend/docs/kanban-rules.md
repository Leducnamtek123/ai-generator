1. Viewport Height Rules (Bắt buộc)

Rule cứng:

Kanban board phải fit trong viewport

Không được phép kéo page scroll dọc vì card

Quy tắc:

Board height = 100vh - header - toolbar

Column height = fixed theo board

Card list scroll bên trong column

Rule text:

Page never scrolls vertically because of Kanban cards. Only columns scroll.

2. Column Scroll Rules

Mỗi column có:

Header (fixed)

Body (scrollable)

Header luôn sticky

Rule text:

Scroll chỉ xảy ra trong column body

Không scroll toàn board theo chiều dọc

3. Column Width Rules

Column width:

Cố định (ví dụ 280–320px)

Không co giãn theo content

Không wrap xuống dòng

Rule text:

Kanban columns scroll horizontally, never wrap.

4. Card Count & Virtualization Rules (CỰC KỲ QUAN TRỌNG)
Render Rule

Không render toàn bộ card cùng lúc

Bắt buộc dùng:

Windowing / Virtual list

Rule text:

Cards must be virtualized per column.

Threshold Rule

Nếu số card trong column > X (ví dụ 50):

Auto bật virtualization

Không cho render full DOM

5. Lazy Loading Rules

Mỗi column:

Load theo page (cursor-based)

Không fetch toàn bộ ứng viên cho board

Rule text:

Kanban data loading must be incremental, not bulk.

6. Drag & Drop Performance Rules

Khi drag:

Chỉ re-render source & target column

Không re-render toàn board

Rule text:

Drag operations must be localized, not global reflows.

7. Card Density Rules

Card height:

Min height cố định

Không auto-expand theo content

Nội dung dư:

Truncate

Tooltip / detail view

Rule text:

Cards must be information-dense, not detail-heavy.

8. Large Data Safeguard Rules (1000+ ứng viên)
Progressive Disclosure

Kanban chỉ show:

Thông tin tối thiểu

Detail → mở drawer / modal

Hard Limits

Có thể áp dụng:

WIP limit

Collapse column quá tải

Rule text:

Kanban must guide flow, not display all data.

9. Anti-patterns (CẤM TUYỆT ĐỐI)

❌ Page scroll dọc vì card

❌ Render 1000 card cùng lúc

❌ Column cao vô hạn

❌ Drag gây re-render toàn board

❌ Card cao thấp không đồng đều

10. Acceptance Checklist (Test nhanh)

Kanban đạt chuẩn khi:

Viewport 100% → không overflow dọc

Column scroll mượt, độc lập

1000+ card vẫn scroll mượt

Drag không lag

Không thấy “dài vô tận”

11. One-line Rule cho AI / FE

“Kanban must be viewport-bound, column-scrolling, and virtualized per column to support large datasets.”