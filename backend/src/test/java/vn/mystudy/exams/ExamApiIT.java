package vn.mystudy.exams;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;

class ExamApiIT extends IntegrationTest {

    private static final String PRACTICE = "d20da322-56e4-53ee-82ee-6ff0cc471cf3";

    @Autowired MockMvc mvc;

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
                .andExpect(jsonPath("$.data.questions[0].correctOption").doesNotExist());
        mvc.perform(get("/api/exams/" + PRACTICE + "/answers"))
                .andExpect(jsonPath("$.data.questions[0].correctOption").value(1))
                .andExpect(jsonPath("$.data.questions[4].correctOption").value(3));
    }

    @Test
    void pdfOnlyExamHasNoOnlineVersion() throws Exception {
        mvc.perform(get("/api/exams/9147f250-3ed8-511a-9ff1-41349c7a7258"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
