URL PARAM GOVERNANCE RULES

(áp cho view / filter / mode / list / table / kanban)

1. Nguyên tắc lõi (Golden Principle)

Thứ gì ảnh hưởng đến dữ liệu được hiển thị → đưa lên URL
Thứ gì chỉ là cách nhìn dữ liệu → không bắt buộc

2. CÁI NÊN đưa lên URL param (BẮT BUỘC)
2.1 View Mode (Card / Table / Kanban)

Vì:

Thay đổi cách người dùng đọc data

Cần share link / reload vẫn giữ trạng thái

Rule text:

View mode là một phần của state điều hướng, phải nằm trong URL.

Ví dụ:

?view=table
?view=card
?view=kanban

2.2 Filter liên quan đến DATA

Status (open / closed)

Department

Location

Search keyword

Pagination (page, cursor)

Rule text:

Mọi filter làm thay đổi tập dữ liệu phải được reflect trong URL.

Ví dụ:

?status=open
?department=tech
?search=architect
?page=2

2.3 Sort

Sort làm thay đổi thứ tự dữ liệu

Rule text:

Sort là data query, không phải UI preference.

3. CÁI KHÔNG NÊN đưa lên URL (HOẶC OPTIONAL)
3.1 UI-only Preference

Mở / đóng sidebar

Dense / comfortable spacing

Highlight / hover state

Column resize tạm thời

Rule text:

UI preference ngắn hạn không cần tồn tại trong URL.

3.2 State mang tính tạm thời

Modal đang mở

Tooltip

Focus input

Hover card

Rule text:

URL không được dùng để biểu diễn transient UI state.

4. FILTER NÀO → URL, FILTER NÀO → LOCAL STATE?
Rule phân định cực dễ nhớ:

Reload page mà user mong trạng thái còn → URL
Reload page mà user không quan tâm → local state

5. URL SCALE RULES (tránh URL thành rác)

Không nhét object JSON dài vào URL

Không encode state UI phức tạp

URL phải:

Readable

Predictable

Stable

Rule text:

URL params must be human-readable and API-aligned.

6. Backend Alignment Rules

URL params phải map 1–1 với API query

Không có param “chỉ frontend hiểu”

Rule text:

URL params must be backend-valid query parameters.

7. Performance Rules

Thay đổi URL param:

Không luôn luôn trigger full reload

Có thể shallow routing

Nhưng state URL vẫn là source of truth

8. Anti-patterns (CẤM)

❌ Filter data nhưng không reflect lên URL

❌ Nhét UI state nhỏ lẻ vào URL

❌ URL thay đổi liên tục theo hover

❌ URL không reload được đúng state cũ

9. Acceptance Checklist

Một page làm đúng khi:

Copy link → mở lại đúng view + filter

Reload page → state dữ liệu giữ nguyên

URL nhìn là hiểu đang xem gì

Không có param vô nghĩa

10. One-line Rule cho AI / FE

“Any state that affects what data is shown must be reflected in the URL; UI-only or transient states must not.”