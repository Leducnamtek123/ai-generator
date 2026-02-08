Ok 👍 mình đưa **nguyên 1 file Markdown tiếng Việt**, viết theo kiểu **rule cứng cho AI**, bạn copy dán dùng thẳng cho system / policy luôn nhé.

```md
# QUY ĐỊNH ICON & TEXT TRONG UI

## Mục đích
Thiết lập quy tắc bắt buộc nhằm đảm bảo:
- Tính nhất quán giao diện
- Khả năng mở rộng lâu dài
- Tương thích dark / light mode
- Khả năng truy cập (accessibility)
- Dễ kiểm soát và audit source code

Tất cả UI, frontend code và nội dung do AI sinh ra BẮT BUỘC tuân theo các quy định dưới đây.

---

## 1. Quy định sử dụng Icon

### 1.1 Nghiêm cấm
KHÔNG được sử dụng trong mọi trường hợp:
- Emoji (ví dụ: 💡 ❗ 🚀 ✔ ✖)
- Icon dạng ký tự / Unicode
- Ký hiệu trang trí chèn trực tiếp vào text UI
- Gõ icon trực tiếp trong JSX / HTML / string

Ví dụ SAI:
```

💡 Câu hỏi gửi tại đây sẽ được thêm vào hàng đợi của ứng viên.

````

---

### 1.2 Bắt buộc
Icon CHỈ được render thông qua:
- Thư viện icon đã được phê duyệt (vd: lucide-react, heroicons)
- Component icon nội bộ (vd: AppIcon)

Ví dụ ĐÚNG:
```tsx
<AppIcon name="idea" />
<Text>
  Câu hỏi gửi tại đây sẽ được thêm vào hàng đợi của ứng viên.
</Text>
````

Nếu chưa có icon phù hợp:

* Yêu cầu bổ sung icon vào design system
* TUYỆT ĐỐI KHÔNG dùng emoji hoặc ký tự thay thế

---

## 2. Quy định về Text UI

### 2.1 Nguyên tắc Text-Only

* Text UI CHỈ được chứa nội dung chữ
* Không được chứa icon, emoji, ký hiệu trang trí
* Mọi yếu tố trực quan phải là component riêng

Ví dụ SAI:

```tsx
<Text>✔ Gửi thành công</Text>
```

Ví dụ ĐÚNG:

```tsx
<div className="flex gap-2">
  <AppIcon name="success" />
  <Text>Gửi thành công</Text>
</div>
```

---

## 3. Quan sát Source & Component có sẵn

* AI BẮT BUỘC phải quan sát source hiện tại trước khi sinh UI
* Ưu tiên sử dụng component và icon đã tồn tại
* Không tự tạo logic icon inline
* Không hardcode ký hiệu trực quan trong content

Thứ tự ưu tiên:

1. Component / icon nội bộ
2. Thư viện dùng chung đã phê duyệt
3. Đề xuất mở rộng design system (không tự ý phát sinh)

---

## 4. Khả năng truy cập & Theme

Các quy định này nhằm đảm bảo:

* Render nhất quán trên mọi OS / trình duyệt
* Kiểm soát được size, màu sắc, spacing
* Tương thích dark mode / light mode
* Hỗ trợ accessibility (ARIA, screen reader)
* Dễ bảo trì và refactor

Emoji và Unicode icon KHÔNG đáp ứng các yêu cầu trên → bị cấm.

---

## 5. Quy định bắt buộc cho AI

AI PHẢI:

* Không sinh emoji hoặc Unicode icon trong UI
* Tách icon và text thành các component riêng
* Chỉ dùng icon có sẵn trong hệ thống
* Tuân thủ frontend rules và lint rules
* Xem vi phạm rule là LỖI, không phải tuỳ chọn thẩm mỹ

---

## 6. Tóm tắt (Hard Rules)

* Không dùng emoji
* Không dùng Unicode icon
* Không chèn icon vào text
* Icon phải là component
* Tôn trọng source và design system hiện có
* Không tự phát sinh yếu tố UI mới

```

Nếu bạn muốn, mình có thể:
- Rút gọn thành **1 đoạn system prompt cho AI**
- Viết thêm **rule riêng cho AI review code**
- Gộp chung với các **UI / FE governance rules khác (table, filter, param, key id, …)**

Bạn đang định nhét file này vào **system prompt**, **policy engine**, hay **repo docs**?
```
