Ok, mình đưa **RULES THUẦN TEXT** — viết theo kiểu **đưa cho AI / FE đọc là phải làm đúng**, không ví dụ, không code, không lan man.

---

# UI Color & Theme Rules (Light / Dark – Component-based)

## 1. Color Usage Principle

* Tuyệt đối **không sử dụng màu trực tiếp** (white, gray, slate, hex, rgb).
* Mọi màu phải đi qua **semantic token**, không phụ thuộc theme cụ thể.
* Component **không được biết** nó đang ở light hay dark, chỉ biết semantic role của nó.

---

## 2. Semantic Token System

Hệ màu phải chia theo **ý nghĩa**, không chia theo màu sắc:

* Background: nền trang
* Surface: khối hiển thị chính
* Muted: vùng phụ, nền thứ cấp
* Accent: hover / focus / active
* Border: phân tách layout
* Foreground: nội dung chính
* Muted Foreground: nội dung phụ

---

## 3. Surface Level Rule

* Mỗi component phải xác định rõ **surface level**.
* Table, Card, List **không bao giờ** được dùng cùng background với page.
* Table bắt buộc là `surface` hoặc `muted surface`, không được là `background`.

---

## 4. Table-Specific Rules

* Table header, body, row phải thuộc **các surface khác nhau**.
* Table row **không được chìm vào background** ở bất kỳ theme nào.
* Border của table phải **luôn phân biệt rõ với row background**.

---

## 5. Border Contrast Rule

* Border **không được cùng độ sáng với background hoặc surface**.
* Trong light mode: border phải tối hơn background.
* Trong dark mode: border phải sáng hơn background.
* Border tồn tại để phân tách, không phải trang trí → phải nhìn thấy rõ.

---

## 6. State Visibility Rule

Mọi component hiển thị dữ liệu (table, list, card) phải có đầy đủ state:

* Default
* Hover
* Active / Selected
* Disabled / Empty

Các state này **bắt buộc phân biệt được bằng màu**, không chỉ bằng icon hoặc text.

---

## 7. Hover & Active Rule

* Hover và Active **không được dùng opacity**.
* Hover và Active phải dùng **semantic accent token riêng**.
* Hover trong dark mode phải rõ ràng như light mode.

---

## 8. Status & Badge Rule

* Badge trong table là **thông tin**, không phải decoration.
* Status color phải là **semantic status** (success, warning, error, info).
* Màu badge phải đảm bảo tương phản với row background ở cả light & dark.

---

## 9. Text Contrast Rule

* Text chính luôn dùng foreground token.
* Text phụ dùng muted-foreground token.
* Không được giảm opacity text để tạo hierarchy.
* Text trong table phải đọc được rõ ở mọi theme.

---

## 10. Light / Dark Theme Rule

* Light và Dark là **hai hệ màu độc lập**, không phải đảo màu của nhau.
* Giá trị token có thể khác nhau giữa theme, nhưng **ý nghĩa token phải giữ nguyên**.
* Không được fix màu dựa trên cảm giác “trông ổn ở light”.

---

## 11. Component Isolation Rule

* Component không được phụ thuộc màu của component cha.
* Component phải tự đúng màu khi được đặt ở bất kỳ layout nào.
* Không chỉnh màu component theo từng page.

---

## 12. Accessibility Minimum

* Mọi text và trạng thái quan trọng phải đạt tương phản đủ để nhận biết bằng mắt thường.
* Không dựa vào màu đơn lẻ để thể hiện trạng thái (màu phải đủ rõ).

---