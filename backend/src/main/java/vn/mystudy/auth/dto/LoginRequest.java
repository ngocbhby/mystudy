package vn.mystudy.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Vui lòng nhập email.")
        @Size(max = 254, message = "Email quá dài.")
        @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Email không hợp lệ.")
        String email,

        @NotBlank(message = "Vui lòng nhập mật khẩu.")
        @Size(max = 1024, message = "Mật khẩu quá dài.")
        String password) {
}
