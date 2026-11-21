package vn.mystudy.samples;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;

class SampleApiIT extends IntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void listsSeededSamplesPublicly() throws Exception {
        mvc.perform(get("/api/samples"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.samples").isArray())
                .andExpect(jsonPath("$.data.samples[?(@.title=='Đạo hàm & khoảng đồng biến')].topic").value("Hàm số"));
    }

    @Test
    void filtersBySubjectAndTopic() throws Exception {
        mvc.perform(get("/api/samples").param("subject", "math"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.samples").isArray());

        String body = mvc.perform(get("/api/samples").param("subject", "literature")).andReturn().getResponse()
                .getContentAsString();
        List<String> ids = JsonPath.read(body, "$.data.topics[?(@.name=='Nghị luận xã hội')].id");
        String topicId = ids.get(0);
        mvc.perform(get("/api/samples").param("topic", topicId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.samples").isArray());
    }

    @Test
    void rejectsUnknownSubjectAndMalformedTopic() throws Exception {
        mvc.perform(get("/api/samples").param("subject", "nope")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/samples").param("topic", "not-a-uuid")).andExpect(status().isBadRequest());
    }
}
