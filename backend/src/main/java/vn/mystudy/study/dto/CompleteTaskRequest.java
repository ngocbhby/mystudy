package vn.mystudy.study.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CompleteTaskRequest(@NotNull(message = "Nhiệm vụ không hợp lệ.") UUID id) {
}
