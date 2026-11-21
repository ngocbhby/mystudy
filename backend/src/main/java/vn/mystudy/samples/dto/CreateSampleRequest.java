package vn.mystudy.samples.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateSampleRequest(
        @NotBlank(message = "Mã môn học không được để trống.")
        @Size(max = 64)
        String subjectCode,

        UUID topicId,

        @Size(max = 255)
        String topicName,

        @NotBlank(message = "Tiêu đề không được để trống.")
        @Size(max = 255)
        String title,

        @NotBlank(message = "Dạng bài không được để trống.")
        @Size(max = 100)
        String exerciseType,

        @NotBlank(message = "Đề bài không được để trống.")
        String prompt,

        @NotBlank(message = "Lời giải mẫu không được để trống.")
        String modelSolution,

        String solutionNote,

        @NotBlank(message = "Nguồn không được để trống.")
        @Size(max = 255)
        String sourceName) {
}
