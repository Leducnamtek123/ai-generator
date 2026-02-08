RULES: Form Field Alignment & Full-Width Consistency
1. Nguyên tắc cốt lõi

Tất cả field trong cùng 1 form phải tuân theo cùng 1 grid

Không field nào được tự quyết định width riêng

Form quyết định layout, component chỉ render nội dung

2. Form Grid Rules
Grid Definition

Form phải dùng grid layout cố định

Ví dụ: 1 column / 2 columns / 3 columns

Mỗi row phải có:

Cùng chiều cao tối thiểu

Cùng khoảng cách ngang & dọc

Rule text:

Không dùng width auto cho form field

Không dùng inline style override width trong field

3. Field Width Rules
Default Width

Mọi input/select/date/time:

width: 100% so với cell grid

Không cho phép:

Input tự co theo content

Select ngắn vì option text ngắn

Special Fields (time, number, duration)

Các field nhỏ (giờ, phút, số):

Vẫn phải chiếm full cell

UI control nhỏ hơn nhưng container vẫn full width

Rule text:

Kích thước visual ≠ kích thước layout

Layout container luôn full width, control bên trong có thể compact

4. Label Alignment Rules

Label phải:

Cùng chiều rộng trong 1 column

Không phụ thuộc độ dài text

Không label nào được wrap làm lệch chiều cao row

Rule text:

Label có max-lines cố định

Overflow → tooltip hoặc ellipsis

5. Height Consistency Rules
Field Height

Tất cả control trong form phải dùng:

Cùng height token (sm / md / lg)

Không field nào cao hơn do icon, helper, prefix

Multi-control Rows

Khi 1 row có nhiều control (date + time):

Các control phải share cùng baseline

Không control nào thấp hơn control khác

6. Spacing Rules
Vertical Spacing

Khoảng cách giữa các field:

Cố định (ví dụ 16px hoặc 24px)

Không phụ thuộc vào:

Có error hay không

Có helper text hay không

Horizontal Spacing

Gap giữa các column:

Cố định

Không cho phép margin tự do giữa field

7. Responsive Rules

Khi chuyển breakpoint:

Grid collapse theo rule (2 → 1 column)

Field vẫn full width theo column mới

Không resize từng field riêng lẻ theo màn hình

Rule text:

Responsive thay đổi grid, không thay đổi field

8. Anti-patterns (Cấm)

❌ Field tự set width theo nội dung

❌ Input giờ/ngày bị ngắn hơn input text

❌ Label dài làm lệch layout

❌ Một row cao hơn row khác chỉ vì loại field

❌ Dùng flex không kiểm soát thay cho grid

9. Acceptance Checklist

Form đạt chuẩn khi:

Nhìn dọc → các field thẳng hàng tuyệt đối

Nhìn ngang → các column đều nhau

Không có cảm giác “field này bé, field kia to”

Resize màn hình → form vẫn gọn, không vỡ

10. One-line Rule cho AI / FE

“All form fields must be full-width within a fixed grid, with uniform height, spacing, and alignment. Components must not control layout width.”