package vn.mystudy.ai;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;
import vn.mystudy.support.TestClient;

/** Tính năng AI với mô hình giả (không gọi API thật): kiểm tra quyền, lưu kết quả, hạn mức và lộ trình thích ứng. */
class AiApiIT extends IntegrationTest {

    private static final String PRACTICE = "d20da322-56e4-53ee-82ee-6ff0cc471cf3";
    private static final String GOAL = """
            {"purpose":"graduation","electiveCodes":["physics","english"],
             "scores":{"math":8,"literature":7,"physics":7,"english":7},
             "currentScores":{"math":4,"literature":6,"physics":6.5,"english":6},
             "months":1,"dailyMinutes":90,"days":[1,2,3,4,5,6,7]}""";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean AiGateway ai;

    @BeforeEach
    void fakeModel() {
        Mockito.reset(ai);
        when(ai.enabled()).thenReturn(true);
        when(ai.model()).thenReturn("fake-model");
        when(ai.generate(anyString(), anyString(), eq(WrongAnswerExplanation.class), anyLong()))
                .thenReturn(new WrongAnswerExplanation("Nhầm công thức đạo hàm lũy thừa.",
                        List.of("Áp dụng $(x^n)' = n x^{n-1}$.", "Với $n = 3$ được $3x^2$."),
                        "Hạ bậc rồi nhân hệ số.", "Đạo hàm cơ bản"));
        when(ai.generate(anyString(), anyString(), eq(TopicNoteDraft.class), anyLong()))
                .thenReturn(new TopicNoteDraft("## Kiến thức trọng tâm\n\nNội dung do AI soạn."));
        when(ai.generate(anyString(), anyString(), eq(WeaknessReport.class), anyLong()))
                .thenReturn(new WeaknessReport("Bạn cần củng cố đạo hàm.",
                        List.of(new WeaknessReport.TopicAdvice("Đạo hàm và khảo sát hàm số", "Sai nhiều câu cơ bản.",
                                List.of("Ôn bảng đạo hàm", "Làm 10 câu đạo hàm cơ bản"))),
                        "Cố lên!"));
    }

    private TestClient signedIn() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        client.post("/api/auth/register",
                "{\"email\":\"ai-" + UUID.randomUUID() + "@example.com\",\"password\":\"a-long-password-123\"}")
                .andExpect(status().isCreated());
        return client;
    }

    /** Làm đề đạo hàm: câu 1 đúng, câu 2-5 sai (đáp án đúng câu 2..5 lần lượt là 3, 4, 2, 3), câu 6-10 bỏ trống. */
    private String submitMostlyWrong(TestClient client) throws Exception {
        String attemptId = JsonPath.read(client.post("/api/exams/" + PRACTICE + "/attempts/start", "{}")
                .andReturn().getResponse().getContentAsString(), "$.data.attemptId");
        client.post("/api/exams/" + PRACTICE + "/attempts/" + attemptId + "/submit",
                        "{\"answers\":{\"1\":1,\"2\":2,\"3\":1,\"4\":4,\"5\":4}}")
                .andExpect(status().isOk());
        return attemptId;
    }

    @Test
    void aiEndpointsRequireSignIn() throws Exception {
        mvc.perform(get("/api/ai/status")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/ai/weakness")).andExpect(status().isUnauthorized());
    }

    @Test
    void explainsWrongAnswersOnceAndReusesTheSavedExplanation() throws Exception {
        TestClient student = signedIn();
        String attemptId = submitMostlyWrong(student);
        String request = "{\"examId\":\"" + PRACTICE + "\",\"attemptId\":\"" + attemptId + "\",\"questionNumber\":2}";

        student.post("/api/ai/explanations", request)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.explanation.steps.length()").value(2))
                .andExpect(jsonPath("$.data.cached").value(false));
        // Học sinh khác chọn cùng đáp án sai nhận lời giải thích đã lưu, không gọi AI thêm.
        TestClient other = signedIn();
        String otherAttempt = submitMostlyWrong(other);
        other.post("/api/ai/explanations",
                        "{\"examId\":\"" + PRACTICE + "\",\"attemptId\":\"" + otherAttempt + "\",\"questionNumber\":2}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cached").value(true));
        verify(ai, times(1)).generate(anyString(), anyString(), eq(WrongAnswerExplanation.class), anyLong());
    }

    @Test
    void refusesCorrectAnswersAndOtherPeoplesAttempts() throws Exception {
        TestClient student = signedIn();
        String attemptId = submitMostlyWrong(student);
        student.post("/api/ai/explanations",
                        "{\"examId\":\"" + PRACTICE + "\",\"attemptId\":\"" + attemptId + "\",\"questionNumber\":1}")
                .andExpect(status().isBadRequest());
        signedIn().post("/api/ai/explanations",
                        "{\"examId\":\"" + PRACTICE + "\",\"attemptId\":\"" + attemptId + "\",\"questionNumber\":2}")
                .andExpect(status().isNotFound());
        verify(ai, never()).generate(anyString(), anyString(), any(), anyLong());
    }

    @Test
    void dailyQuotaStopsCallsBeforeTheyCostMoney() throws Exception {
        TestClient student = signedIn();
        // Hạn mức trong cấu hình test là 3 lượt/ngày; mỗi chuyên đề chưa có ghi chú tốn một lượt.
        List<String> topics = jdbc.queryForList("""
                SELECT t.id::text FROM topics t LEFT JOIN topic_notes n ON n.topic_id = t.id
                WHERE n.topic_id IS NULL AND t.curriculum_order IS NOT NULL AND t.subject_code = 'history'
                ORDER BY t.curriculum_order LIMIT 4""", String.class);
        for (int i = 0; i < 3; i++) {
            student.post("/api/ai/topics/" + topics.get(i) + "/note", "{}")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.aiGenerated").value(true));
        }
        student.post("/api/ai/topics/" + topics.get(3) + "/note", "{}").andExpect(status().isTooManyRequests());
        student.get("/api/ai/status").andExpect(jsonPath("$.data.remainingToday").value(0));
        // Ghi chú đã soạn được đọc công khai, không tốn lượt.
        mvc.perform(get("/api/topics/" + topics.get(0) + "/note"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contentMd").value(org.hamcrest.Matchers.containsString("Kiến thức")));
    }

    @Test
    void weaknessAnalysisUsesRealNumbersAndAdaptsThePlan() throws Exception {
        TestClient student = signedIn();
        student.post("/api/study/goal", GOAL).andExpect(status().isCreated());
        submitMostlyWrong(student);

        student.get("/api/ai/weakness")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.topics[0].topicName").value("Đạo hàm và khảo sát hàm số"))
                .andExpect(jsonPath("$.data.topics[0].correct").value(1))
                .andExpect(jsonPath("$.data.topics[0].total").value(10))
                .andExpect(jsonPath("$.data.report").doesNotExist());

        student.post("/api/ai/weakness/report", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.report.priorities[0].nextTasks.length()").value(2))
                .andExpect(jsonPath("$.data.reportStale").value(false));

        student.post("/api/study/plan/rebuild", "{}").andExpect(status().isOk());
        // Chuyên đề đạo hàm (đúng 10%) xuất hiện nhiều hơn các chuyên đề Toán khác trong lộ trình mới.
        Integer derivative = jdbc.queryForObject("""
                SELECT count(*) FROM study_tasks st JOIN topics t ON t.id = st.topic_id
                JOIN study_plans p ON p.id = st.plan_id AND p.superseded_at IS NULL
                WHERE p.profile_id = (SELECT profile_id FROM ai_weakness_reports ORDER BY created_at DESC LIMIT 1)
                  AND t.name = 'Đạo hàm và khảo sát hàm số' AND st.cancelled_at IS NULL""", Integer.class);
        Integer integral = jdbc.queryForObject("""
                SELECT count(*) FROM study_tasks st JOIN topics t ON t.id = st.topic_id
                JOIN study_plans p ON p.id = st.plan_id AND p.superseded_at IS NULL
                WHERE p.profile_id = (SELECT profile_id FROM ai_weakness_reports ORDER BY created_at DESC LIMIT 1)
                  AND t.name = 'Nguyên hàm và tích phân' AND st.cancelled_at IS NULL""", Integer.class);
        org.assertj.core.api.Assertions.assertThat(derivative).isGreaterThan(2 * integral);
    }

    @Test
    void failedAiCallsDoNotUseUpTheDailyQuota() throws Exception {
        TestClient student = signedIn();
        when(ai.generate(anyString(), anyString(), eq(TopicNoteDraft.class), anyLong()))
                .thenThrow(new vn.mystudy.common.exception.BusinessException(
                        vn.mystudy.common.api.ErrorCode.SERVICE_UNAVAILABLE, "AI quá tải"));
        String topic = jdbc.queryForObject("""
                SELECT t.id::text FROM topics t LEFT JOIN topic_notes n ON n.topic_id = t.id
                WHERE n.topic_id IS NULL AND t.curriculum_order IS NOT NULL AND t.subject_code = 'geography'
                ORDER BY t.curriculum_order LIMIT 1""", String.class);

        student.post("/api/ai/topics/" + topic + "/note", "{}").andExpect(status().isServiceUnavailable());
        student.post("/api/ai/topics/" + topic + "/note", "{}").andExpect(status().isServiceUnavailable());

        // Hai lần gọi lỗi được hoàn lượt: vẫn còn đủ 3/3 lượt trong ngày.
        student.get("/api/ai/status").andExpect(jsonPath("$.data.remainingToday").value(3));
    }
}
