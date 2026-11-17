package vn.mystudy.study;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;
import vn.mystudy.support.TestClient;

class StudyApiIT extends IntegrationTest {

    private static final String GOAL = """
            {"purpose":"university_admission","electiveCodes":["physics","english"],
             "scores":{"math":8,"literature":7.5,"physics":8,"english":8.5},
             "months":2,"dailyMinutes":90,"days":[1,2,3,4,5,6,7]}""";

    @Autowired MockMvc mvc;

    private TestClient signedIn() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        client.post("/api/auth/register",
                "{\"email\":\"study-" + UUID.randomUUID() + "@example.com\",\"password\":\"a-long-password-123\"}")
                .andExpect(status().isCreated());
        return client;
    }

    @Test
    void newAccountHasNoGoalAndInvalidGoalReportsFieldErrors() throws Exception {
        TestClient client = signedIn();
        client.get("/api/study/goal")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.goal").doesNotExist())
                .andExpect(jsonPath("$.data.plan").doesNotExist());

        client.post("/api/study/goal", """
                {"purpose":"x","electiveCodes":["physics","physics"],"scores":{"math":11},
                 "months":6.5,"dailyMinutes":0,"days":[]}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.purpose").exists())
                .andExpect(jsonPath("$.errors.electives").exists())
                .andExpect(jsonPath("$.errors.math").exists())
                .andExpect(jsonPath("$.errors.months").exists())
                .andExpect(jsonPath("$.errors.dailyMinutes").exists())
                .andExpect(jsonPath("$.errors.days").exists());
    }

    @Test
    void savingGoalBuildsPlanThenTaskCanBeCompletedAndReplanKeepsIt() throws Exception {
        TestClient client = signedIn();
        client.post("/api/study/goal", GOAL)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.goal.electiveCodes[0]").value("physics"))
                .andExpect(jsonPath("$.data.goal.days.length()").value(7))
                .andExpect(jsonPath("$.data.plan.strategy").value("exam_focused"));

        client.get("/api/study/goal").andExpect(jsonPath("$.data.plan.id").exists())
                .andExpect(jsonPath("$.data.goal.scores.english").value(8.5));

        String overview = client.get("/api/study/overview").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tasks.length()").value(2))
                .andExpect(jsonPath("$.data.streakDays").value(0))
                .andReturn().getResponse().getContentAsString();
        String taskId = JsonPath.read(overview, "$.data.tasks[0].id");

        client.post("/api/study/tasks", "{\"id\":\"" + taskId + "\"}").andExpect(status().isOk());
        client.post("/api/study/tasks", "{\"id\":\"" + taskId + "\"}").andExpect(status().isOk());
        client.get("/api/study/overview")
                .andExpect(jsonPath("$.data.tasks[0].completed").value(true))
                .andExpect(jsonPath("$.data.streakDays").value(1));

        client.delete("/api/study/tasks/" + taskId).andExpect(status().isOk());
        client.get("/api/study/overview")
                .andExpect(jsonPath("$.data.tasks[0].completed").value(false))
                .andExpect(jsonPath("$.data.streakDays").value(0));

        client.post("/api/study/tasks", "{\"id\":\"" + taskId + "\"}").andExpect(status().isOk());
        client.post("/api/study/tasks/uncomplete", "{\"id\":\"" + taskId + "\"}").andExpect(status().isOk());
        client.get("/api/study/overview")
                .andExpect(jsonPath("$.data.tasks[0].completed").value(false))
                .andExpect(jsonPath("$.data.streakDays").value(0));

        client.post("/api/study/tasks", "{\"id\":\"" + taskId + "\"}").andExpect(status().isOk());

        client.post("/api/study/goal", GOAL.replace("\"days\"", "\"strategy\":\"foundation_first\",\"days\""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.plan.strategy").value("foundation_first"));
        String after = client.get("/api/study/overview").andReturn().getResponse().getContentAsString();
        assertThat((Integer) JsonPath.read(after, "$.data.tasks.length()")).isEqualTo(2);
        assertThat((Boolean) JsonPath.read(after, "$.data.tasks[0].completed")).isTrue();
        assertThat((String) JsonPath.read(after, "$.data.tasks[0].id")).isEqualTo(taskId);
    }

    @Test
    void tasksRangeIsValidatedAndTasksAreOwnedByTheirUser() throws Exception {
        TestClient owner = signedIn();
        owner.post("/api/study/goal", GOAL).andExpect(status().isCreated());
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        owner.get("/api/study/tasks?from=" + today + "&to=" + today.plusDays(6))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.tasks").isArray());
        owner.get("/api/study/tasks?from=" + today + "&to=" + today.plusDays(30))
                .andExpect(status().isBadRequest());
        owner.get("/api/study/tasks?from=nope&to=nope").andExpect(status().isBadRequest());

        String overview = owner.get("/api/study/overview").andReturn().getResponse().getContentAsString();
        String taskId = JsonPath.read(overview, "$.data.tasks[0].id");
        TestClient stranger = signedIn();
        stranger.post("/api/study/tasks", "{\"id\":\"" + taskId + "\"}")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
