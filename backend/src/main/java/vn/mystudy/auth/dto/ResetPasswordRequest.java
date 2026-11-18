package vn.mystudy.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Vui lòng nhập email.")
        @Size(max = 254, message = "Email quá dài.")
        @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Email không hợp lệ.")
        String email,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
        @Size(min = 12, max = 256, message = "Mật khẩu cần từ 12 đến 256 ký tự.")
        String newPassword,

        @NotBlank(message = "Vui lòng xác nhận mật khẩu mới.")
        String confirmPassword) {
}
