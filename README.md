# Smart OPD

Bản web demo tương tác bằng tiếng Việt, triển khai theo 9 màn hình tham chiếu và sơ đồ ERD được cung cấp.

## Giao diện 2.0

### Cập nhật 2.1 — giao diện vận hành

Đã bỏ nhãn “demo” khỏi các màn hình làm việc, thu gọn phần giới thiệu và chuyển dashboard sang các tác vụ điều phối. Giới hạn triển khai được trình bày tại “Thông tin hệ thống”. Tổng lượt khám, tỷ lệ hoàn tất, thời gian chờ, danh sách cần xử lý, biểu đồ và báo cáo CSV được tính từ cùng bộ hồ sơ trên trình duyệt. Không dùng số liệu 1.248 lượt hoặc tỷ lệ cải thiện 41% làm kết quả vận hành.

- Dashboard mới với vùng điều phối chính, cảnh báo ưu tiên, chỉ số và biểu đồ rõ hơn.
- Panel hồ sơ bên phải: xem hành trình, lưu ghi chú, hoàn thành bước, chuyển phòng và mở hồ sơ đầy đủ.
- Bộ lọc nhanh theo thời gian chờ / ưu tiên / nhu cầu điều phối; tìm người bệnh có hoặc không dấu; lưu bộ lọc qua tải lại.
- Bảng có tiêu đề và cột người bệnh cố định, lựa chọn mật độ gọn / thoáng; giữ vị trí khi quay lại danh sách trong phiên.
- Tìm nhanh người bệnh và chức năng bằng `Ctrl + K` hoặc `Cmd + K`; phím mũi tên và Enter để chọn, Escape để đóng. Phím `/` tìm trong danh sách.
- Hiệu ứng chuyển trang, panel trượt, phản hồi nút, cập nhật tiến trình và highlight hàng đã đổi. Tôn trọng giảm chuyển động của hệ điều hành; có cài đặt riêng trong “Tùy chỉnh trải nghiệm”.
- Focus trong hộp thoại/panel, ngăn tương tác với nội dung nền khi mở, trạng thái có nhãn chữ, hỗ trợ màn hình nhỏ.

Phần UI này đã được kiểm tra bằng trình duyệt tự động; chưa phải chứng nhận WCAG hoặc đánh giá usability với nhân viên y tế thực tế.

## Chạy tại máy

Yêu cầu Node.js 18 trở lên. Không cần cài dependency.

```sh
cd smart-opd
node server.cjs
```

Mở http://127.0.0.1:4173. Trang mặc định là dashboard. Màn hình đăng nhập tại `/#login`.

Tài khoản cục bộ: `lan.nt@benhvien.vn` / `Opd@2026`. Có thể chọn trực tiếp Quản trị viên, Điều phối viên hoặc Bác sĩ; đổi vai trò ở thanh trên cùng. Mật khẩu cũ `demo123` vẫn được chấp nhận để tương thích bản trước. Đây chưa phải xác thực máy chủ.

## Luồng đã triển khai

- Dashboard theo vai trò, biểu đồ SVG, bảng nguồn lực, cảnh báo và xuất CSV.
- Danh sách bệnh nhân: tìm tên/mã/số điện thoại, lọc trạng thái/phòng/mức ưu tiên, phân trang, đăng ký bệnh nhân, xuất CSV.
- Hồ sơ bệnh nhân: hành trình 21 hoạt động, cập nhật hoàn thành, điều phối phòng và ghi chú.
- Gợi ý điều phối: chấp nhận, từ chối có lý do, ghi đè thủ công, lưu lịch sử quyết định.
- Mô phỏng: số bệnh nhân, loại hàng đợi, năng lực phòng, thời lượng, hệ số tối ưu, kịch bản lưu, chạy/tạm dừng và xuất kết quả.
- SAS Wizard: 5 câu hỏi, sửa câu trả lời, lưu tiến độ, quy tắc gợi ý phương pháp, xuất báo cáo.
- Quản lý người dùng: thêm/sửa, kiểm tra email trùng, lọc vai trò/trạng thái, ma trận quyền.
- Nhật ký: ghi nhận các thao tác, tìm kiếm, xuất CSV.
- Responsive cho desktop, tablet và điện thoại. Modal có focus trap và đóng bằng Escape.

## Dữ liệu và giới hạn

Đây là **frontend prototype**, chưa có backend, API, xác thực thật, SSO, HIS hay mô hình AI. Không nhập dữ liệu y tế thật. Dữ liệu mẫu, tài khoản, quyết định và nhật ký được lưu bằng localStorage trên trình duyệt, không đồng bộ giữa thiết bị. Vai trò chỉ điều khiển giao diện và không phải biện pháp bảo mật máy chủ.

Bộ dữ liệu khởi tạo có 24 hồ sơ giả lập ngày 14/10/2026. Tổng quan và báo cáo điều phối tổng hợp trực tiếp từ các hồ sơ hiện có. Mô phỏng sử dụng công thức xác định từ cấu hình, không phải mô hình hàng đợi đã được kiểm định. SAS Wizard dùng quy tắc chấm điểm tham khảo.

Các đối tượng frontend tương ứng với ERD: tài khoản/vai trò, phiếu khám và hoạt động, gợi ý và quyết định, lý do ghi đè, kịch bản và kết quả mô phỏng, nhật ký hệ thống. Schema SQL trong `database/schema.sql` là nền tảng tham khảo cho bước tích hợp backend, chưa được kết nối với bản web.

## Cấu trúc

```
dist/index.html       Trang ứng dụng
dist/styles.css       Giao diện responsive
dist/app.js           UI, dữ liệu mẫu, state và tương tác
dist/studio.js        Dashboard 2.0, bảng bệnh nhân, panel, tìm nhanh và tùy chỉnh
dist/studio.css       Giao diện và chuyển động 2.0
dist/operations.js    Tổng quan vận hành, chỉ số từ hồ sơ, báo cáo và thông tin hệ thống
dist/operations.css   Bố cục điều phối ngoại trú 2.1
server.cjs            Server tĩnh local
database/schema.sql  Schema tham khảo theo ERD
.openai/hosting.json  Cấu hình Sites cục bộ, không đưa vào repository
```

Kiểm tra cú pháp: `npm.cmd run check` trên Windows hoặc `npm run check` trên macOS/Linux.

Kiểm tra trình duyệt: `qa.cjs` dùng Playwright Core và Chromium có sẵn; cài riêng dependency kiểm thử hoặc đặt biến `OPD_PLAYWRIGHT_PATH` trỏ tới thư viện Playwright Core. Chạy server local trước rồi chạy `node qa.cjs`.

Kiểm tra riêng các tương tác mới: `node qa-studio.cjs` với cùng cấu hình Playwright.

Đã kiểm tra bằng Chromium ở 1440px và 390px: các trang, tìm/lọc và tạo bệnh nhân, ghi chú/tiến trình/điều phối/lưu qua tải lại, chấp nhận/từ chối gợi ý, mô phỏng chạy–dừng–tiếp tục và tải CSV, 5 bước Wizard, tạo/lọc người dùng, điều hướng theo vai trò, không tràn ngang ở mobile và không có lỗi JavaScript runtime trong các luồng kiểm tra.

Biểu đồ, biểu tượng, hình bệnh viện là SVG nội bộ. Font Be Vietnam Pro tải từ Google Fonts; có fallback sans-serif khi không có mạng.
