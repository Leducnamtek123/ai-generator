Ok 👍 mình đưa **file Markdown RULE CỨNG**, viết để **AI + dev đều phải tuân theo**, bạn copy dán dùng thẳng nhé.

```md
# QUY ĐỊNH QUẢN LÝ FILE & ĐỘ DÀI SOURCE CODE

## Mục tiêu
Ngăn chặn tình trạng file source quá dài, khó đọc, khó bảo trì và gây quá tải cho AI, code review cũng như quá trình mở rộng hệ thống.

Các quy định này áp dụng cho:
- Source code (JS / TS / JSX / TSX)
- File JSON (i18n, config, constant)
- AI rules / prompt / policy
- Mọi file phục vụ UI và logic nghiệp vụ

---

## 1. Giới hạn độ dài file (Hard Limits)

- File ≤ **300 dòng**: An toàn
- File **301–500 dòng**: Cần xem xét tách
- File **> 500 dòng**: KHÔNG khuyến khích
- File **> 1000 dòng**: **BẮT BUỘC refactor**

Không có ngoại lệ cho bất kỳ loại file nào.

---

## 2. Nguyên tắc chia file (Bắt buộc)

### 2.1 Chia theo DOMAIN, không chia theo TYPE

❌ Sai:
```

constants.ts
enums.ts
utils.ts

```

✅ Đúng:
```

applicant/
interview/
hr/
auth/
ai/

```

Mỗi folder đại diện cho **1 nghiệp vụ / domain rõ ràng**.

---

### 2.2 Một file = một trách nhiệm chính

- Mỗi file chỉ nên phục vụ **1 mục đích**
- Không tồn tại “god file” chứa nhiều logic không liên quan
- Nếu phải scroll quá nhiều để hiểu → file đó cần bị tách

---

## 3. Quy định riêng cho JSON & Config

- Không gom toàn bộ JSON vào 1 file
- i18n phải chia theo domain

Ví dụ:
```

locales/
└─ vi/
├─ common.json
├─ applicant.json
├─ interview.json
└─ hr.json

```

### Giới hạn:
- 1 file JSON ≤ **200–300 dòng**
- JSON chỉ chứa dữ liệu, không chứa logic hay format phức tạp

---

## 4. Quy định cho AI Rules / Prompt

- Không đặt toàn bộ rule trong 1 file duy nhất
- Rule phải chia theo chủ đề

Ví dụ:
```

ai-rules/
├─ ui.md
├─ icon.md
├─ i18n.md
├─ file-structure.md
└─ security.md

```

### Khi compose system prompt:
- Chỉ load các rule liên quan
- Tránh prompt quá dài gây overload cho AI

---

## 5. Quy định về Maintainability

- File quá dài phải bị coi là **technical debt**
- Refactor là bắt buộc, không phải tuỳ chọn
- PR tạo file > 500 dòng phải có lý do rõ ràng
- PR tạo file > 1000 dòng phải bị từ chối

---

## 6. Quy định cho AI khi sinh code

AI PHẢI:
- Không sinh file vượt quá 300–500 dòng
- Chủ động đề xuất chia file khi code dài
- Không gom logic nhiều domain vào một file
- Ưu tiên cấu trúc rõ ràng, dễ mở rộng

Nếu nội dung sinh ra vượt giới hạn:
- AI phải chia thành nhiều file
- Hoặc yêu cầu xác nhận kiến trúc trước khi tiếp tục

---

## 7. Tóm tắt (Hard Rules)

- Không có file > 1000 dòng
- Trên 500 dòng là dấu hiệu cần refactor
- Chia theo domain, không chia theo type
- Một file = một trách nhiệm
- Chống god-file bằng mọi giá
```
