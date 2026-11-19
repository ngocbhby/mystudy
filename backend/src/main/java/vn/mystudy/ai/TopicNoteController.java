package vn.mystudy.ai;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;

/** Đọc ghi chú kiến thức của chuyên đề (công khai, không gọi AI). */
@RestController
@RequestMapping("/api/topics")
class TopicNoteController {

    private final TopicNoteService notes;

    TopicNoteController(TopicNoteService notes) {
        this.notes = notes;
    }

    @GetMapping("/{topicId}/note")
    ApiResponse<TopicNoteService.TopicNote> note(@PathVariable UUID topicId) {
        return ApiResponse.ok(notes.get(topicId));
    }
}
