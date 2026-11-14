package vn.mystudy.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Trạng thái phiên: người dùng hiện tại (null nếu chưa đăng nhập) và việc Google có được bật không. */
public record SessionResponse(@JsonInclude(JsonInclude.Include.ALWAYS) UserResponse user, boolean googleEnabled) {
}
