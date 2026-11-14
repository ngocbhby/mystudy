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
                .andExpect(jsonPath("$.data.samples.length()").value(3))
                .andExpect(jsonPath("$.data.subjects.length()").value(2))
                .andExpect(jsonPath("$.data.topics.length()").value(3))
                .andExpect(jsonPath("$.data.samples[?(@.title=='Đạo hàm & khoảng đồng biến')].topic").value("Hàm số"));
    }

    @Test
    void filtersBySubjectAndTopic() throws Exception {
        mvc.perform(get("/api/samples").param("subject", "math"))
                .andExpect(jsonPath("$.data.samples.length()").value(1));

        String body = mvc.perform(get("/api/samples").param("subject", "literature")).andReturn().getResponse()
                .getContentAsString();
        List<String> ids = JsonPath.read(body, "$.data.topics[?(@.name=='Kĩ năng viết')].id");
        String topicId = ids.get(0);
        mvc.perform(get("/api/samples").param("topic", topicId))
                .andExpect(jsonPath("$.data.samples.length()").value(1))
                .andExpect(jsonPath("$.data.samples[0].title").value("Lập dàn ý nghị luận xã hội"));
    }

    @Test
    void rejectsUnknownSubjectAndMalformedTopic() throws Exception {
        mvc.perform(get("/api/samples").param("subject", "nope")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/samples").param("topic", "not-a-uuid")).andExpect(status().isBadRequest());
    }
}
