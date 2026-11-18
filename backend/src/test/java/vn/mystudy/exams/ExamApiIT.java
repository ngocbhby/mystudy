package vn.mystudy.exams;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;
import vn.mystudy.support.TestClient;

class ExamApiIT extends IntegrationTest {

    private static final String PRACTICE = "d20da322-56e4-53ee-82ee-6ff0cc471cf3";

    private static final String TOKEN = "X-Attempt-Token";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    private TestClient signedIn() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        client.post("/api/auth/register",
                "{\"email\":\"exam-" + UUID.randomUUID() + "@example.com\",\"password\":\"a-long-password-123\"}")
                .andExpect(status().isCreated());
        return client;
    }

    @Test
    void listPutsOnlineExamFirstAndExposesFilters() throws Exception {
        mvc.perform(get("/api/exams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.exams.length()").value(4))
                .andExpect(jsonPath("$.data.exams[0].id").value(PRACTICE))
                .andExpect(jsonPath("$.data.exams[0].questionCount").value(10))
                .andExpect(jsonPath("$.data.years[0]").value(2026))
                .andExpect(jsonPath("$.data.subjects").isArray());
    }

    @Test
    void filtersBySubjectAndRejectsInvalidFilters() throws Exception {
        mvc.perform(get("/api/exams").param("subject", "english"))
                .andExpect(jsonPath("$.data.exams.length()").value(1));
        mvc.perform(get("/api/exams").param("subject", "nope"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
        mvc.perform(get("/api/exams").param("year", "20x5")).andExpect(status().isBadRequest());
    }

    @Test
    void questionsHideAnswersUnlessRequested() throws Exception {
        mvc.perform(get("/api/exams/" + PRACTICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions.length()").value(10))
                .andExpect(jsonPath("$.data.questions[0].options.length()").value(4))
                .andExpect(jsonPath("$.data.questions[0].correctOption").doesNotExist())
                .andExpect(jsonPath("$.data.questions[0].explanation").doesNotExist());
        // Khóa đáp án không còn công khai: học sinh chỉ thấy đáp án sau khi nộp bài.
        mvc.perform(get("/api/exams/" + PRACTICE + "/answers")).andExpect(status().isUnauthorized());
        TestClient student = signedIn();
        student.get("/api/exams/" + PRACTICE + "/answers").andExpect(status().isForbidden());
    }

    @Test
    void guestStartsThenSubmitsAndServerGradesOnce() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");

        MvcResult started = client.post("/api/exams/" + PRACTICE + "/attempts/start", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptId").exists())
                .andExpect(jsonPath("$.data.expiresAt").exists())
                .andExpect(jsonPath("$.data.attemptToken").isNotEmpty())
                .andReturn();
        String attemptId = JsonPath.read(started.getResponse().getContentAsString(), "$.data.attemptId");
        String token = JsonPath.read(started.getResponse().getContentAsString(), "$.data.attemptToken");
        String submit = "/api/exams/" + PRACTICE + "/attempts/" + attemptId + "/submit";
        String answers = "{\"answers\":{\"1\":1,\"2\":2,\"3\":9}}";

        // Không có token của lượt thi thì không được nộp thay.
        client.post(submit, answers).andExpect(status().isForbidden());

        client.post(submit, answers, TOKEN, token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questionCount").value(10))
                .andExpect(jsonPath("$.data.correctCount").value(1))
                .andExpect(jsonPath("$.data.incorrectCount").value(1))
                // Lựa chọn 9 không tồn tại nên bị bỏ qua, tính là bỏ trống.
                .andExpect(jsonPath("$.data.blankCount").value(8))
                .andExpect(jsonPath("$.data.score").value(1.0))
                .andExpect(jsonPath("$.data.questions[0].isCorrect").value(true))
                .andExpect(jsonPath("$.data.questions[0].explanation").isNotEmpty())
                .andExpect(jsonPath("$.data.questions[1].correctOption").value(3))
                .andExpect(jsonPath("$.data.questions[1].userOption").value(2));

        // Nộp lại (bấm hai lần, mạng chập chờn) trả kết quả đã chốt, không chấm lại với đáp án mới.
        client.post(submit, "{\"answers\":{\"1\":1,\"2\":3,\"3\":2}}", TOKEN, token)
                .andExpect(jsonPath("$.data.correctCount").value(1));

        client.get("/api/exams/" + PRACTICE + "/attempts/" + attemptId).andExpect(status().isForbidden());
        client.get("/api/exams/" + PRACTICE + "/attempts/" + attemptId, TOKEN, token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.correctCount").value(1));
    }

    @Test
    void submissionsLongAfterTheDeadlineAreNotAccepted() throws Exception {
        TestClient client = signedIn();
        String attemptId = JsonPath.read(client.post("/api/exams/" + PRACTICE + "/attempts/start", "{}")
                .andReturn().getResponse().getContentAsString(), "$.data.attemptId");
        // Giả lập đã quá hạn nộp 5 phút (quá thời gian ân hạn 60 giây).
        jdbc.update("UPDATE exam_attempts SET started_at = now() - interval '30 minutes', "
                + "expires_at = now() - interval '5 minutes' WHERE id = ?::uuid", attemptId);

        client.post("/api/exams/" + PRACTICE + "/attempts/" + attemptId + "/submit",
                        "{\"answers\":{\"1\":1,\"2\":3}}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.correctCount").value(0))
                .andExpect(jsonPath("$.data.blankCount").value(10))
                // Thời gian làm bài do máy chủ tính, chỉ tới hạn nộp (25 phút), không tin số giây trình duyệt gửi.
                .andExpect(jsonPath("$.data.elapsedSeconds").value(1500));
    }

    @Test
    void attemptsBelongToTheirOwner() throws Exception {
        TestClient owner = signedIn();
        String attemptId = JsonPath.read(owner.post("/api/exams/" + PRACTICE + "/attempts/start", "{}")
                .andReturn().getResponse().getContentAsString(), "$.data.attemptId");
        owner.post("/api/exams/" + PRACTICE + "/attempts/" + attemptId + "/submit", "{\"answers\":{\"1\":1}}")
                .andExpect(status().isOk());
        owner.get("/api/exams/" + PRACTICE + "/attempts/latest")
                .andExpect(jsonPath("$.data.id").value(attemptId));

        TestClient other = signedIn();
        other.get("/api/exams/" + PRACTICE + "/attempts/" + attemptId).andExpect(status().isForbidden());
        other.post("/api/exams/" + PRACTICE + "/attempts/" + attemptId + "/submit", "{\"answers\":{}}")
                .andExpect(status().isForbidden());
        // Người lạ (chưa đăng nhập) cũng không xem được.
        mvc.perform(get("/api/exams/" + PRACTICE + "/attempts/" + attemptId)).andExpect(status().isForbidden());
    }

    @Test
    void unfinishedAttemptsDoNotShowUpAsLatestResult() throws Exception {
        TestClient client = signedIn();
        client.post("/api/exams/" + PRACTICE + "/attempts/start", "{}").andExpect(status().isOk());
        client.get("/api/exams/" + PRACTICE + "/attempts/latest").andExpect(jsonPath("$.data").doesNotExist());
        client.get("/api/exams/" + PRACTICE + "/attempts").andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void pdfOnlyExamHasNoOnlineVersion() throws Exception {
        mvc.perform(get("/api/exams/9147f250-3ed8-511a-9ff1-41349c7a7258"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
