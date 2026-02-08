RULES: Form Layout Stability (Tags & Validation)
1. Quy tắc chung (Global)

Form layout KHÔNG được thay đổi kích thước tổng thể khi:

Tags được thêm / xóa

Validation message xuất hiện / biến mất

Không đẩy các field phía dưới theo chiều dọc (no layout jump).

Ưu tiên reserve space trước thay vì render động theo content.

2. Rules cho Tags (chips, badges, multi-value input)
Tag Container Rules

Tag container phải có:

min-height cố định (theo 1–2 dòng tag)

max-height + overflow-y: auto

Không cho tag container auto-expand vô hạn theo chiều cao.

Rule text:

Tag list luôn nằm trong một wrapper có chiều cao ổn định.

Khi số lượng tag vượt ngưỡng → scroll nội bộ, không đẩy form.

Tag Placement Rules

Tags không được render inline làm thay đổi height của input

Tags phải:

Nằm dưới input trong vùng cố định

Hoặc bên trong input nhưng dùng absolute positioning

Responsive Rule

Khi wrap sang dòng mới:

Không được làm thay đổi baseline của form row

Phải scroll hoặc truncate

3. Rules cho Zod / Validation Error Messages
Validation Space Reservation

Mỗi form field phải có:

Một error slot cố định (reserved space)

Dù có lỗi hay không

Rule text:

Error message container luôn tồn tại trong DOM.

Khi không có lỗi → render empty / invisible (not display: none).

Error Height Rules

Error message có:

min-height cố định (theo 1 dòng text)

Không auto-expand quá giới hạn

Error Overflow Rules

Nếu message dài:

Ellipsis hoặc wrap trong max-height

Không đẩy layout

4. Alignment & Grid Rules
Form Row Structure

Mỗi field = 1 row độc lập:

Label

Input area

Helper / Error area

Rule text:

Không cho error của field A ảnh hưởng spacing của field B.

Grid Stability

Trong grid (2–3 cột):

Chiều cao row phải đồng nhất theo max height cố định

Không để 1 field lỗi làm lệch các field cùng hàng

5. Animation & Transition Rules

Cấm dùng:

height: auto + transition

Chỉ cho phép:

opacity

visibility

Không animate height của form row

6. Anti-patterns (Cấm)

❌ Render error message bằng conditional khiến DOM thêm/xóa node

❌ Tags làm input cao lên theo số lượng

❌ Validation message push layout

❌ Dùng margin-bottom động theo lỗi

7. Acceptance Criteria (Checklist)

Một form đạt chuẩn khi:

Thêm tag → không có layout jump

Bật / tắt validation → form không nhúc nhích

Scroll chỉ xảy ra bên trong field, không phải toàn form
UX ổn định ở cả light / dark mode

8. Sticky Action Rules (Form Footer)

Đối với form dài hoặc có textarea:

Nút Submit / Cancel phải luôn nằm trong một sticky wrapper ở cuối form hoặc cuối màn hình.

Phải reserve một khoảng trống (padding-bottom) ở cuối form tương ứng với chiều cao của sticky footer để tránh footer che khuất nội dung field cuối cùng.

Rule text:

Form footer phải có vị trí cố định (fixed/sticky) khi form vượt quá chiều cao viewport.

Không để nội dung field cuối cùng bị "chìm" dưới các nút action.