package vn.mystudy.samples;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;
import vn.mystudy.support.TestClient;

class AdminSampleApiIT extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    private TestClient adminClient() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        String password = "admin-password-123";
        client.post("/api/auth/register",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .andExpect(status().isCreated());
        jdbc.update("UPDATE profiles SET role = 'ADMIN' WHERE lower(email) = ?", email);
        client.post("/api/auth/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .andExpect(status().isOk());
        return client;
    }

    private TestClient regularUserClient() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        String email = "user-" + UUID.randomUUID() + "@example.com";
        String password = "user-password-123";
        client.post("/api/auth/register",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .andExpect(status().isCreated());
        return client;
    }

    @Test
    void nonAdminCannotAccessAdminSampleEndpoints() throws Exception {
        TestClient client = regularUserClient();
        client.post("/api/admin/samples", """
                {
                    "subjectCode": "math",
                    "topicName": "Hàm số",
                    "title": "Bài tập test",
                    "exerciseType": "Lời giải từng bước",
                    "prompt": "Đề bài test",
                    "modelSolution": "Lời giải test",
                    "sourceName": "Test source"
                }
                """).andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateUpdateAndDeleteSample() throws Exception {
        TestClient client = adminClient();

        // 1. Tạo bài mẫu mới
        var createResult = client.post("/api/admin/samples", """
                {
                    "subjectCode": "math",
                    "topicName": "Chuyên đề mới tạo",
                    "title": "Tìm GTLN của hàm số",
                    "exerciseType": "Lời giải từng bước",
                    "prompt": "Tìm GTLN của y = -x^2 + 4x trên đoạn [0; 3]",
                    "modelSolution": "Đạo hàm: y' = -2x + 4 = 0 <=> x = 2.\\nTa có: y(0) = 0, y(2) = 4, y(3) = 3.\\nVậy max = 4 tại x = 2.",
                    "solutionNote": "Tính đạo hàm -> tìm nghiệm thuộc đoạn -> tính giá trị tại các đầu mút.",
                    "sourceName": "Đề khảo sát"
                }
                """).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Tìm GTLN của hàm số"))
                .andExpect(jsonPath("$.data.subjectCode").value("math"))
                .andReturn();

        String responseJson = createResult.getResponse().getContentAsString();
        String sampleId = JsonPath.read(responseJson, "$.data.id");

        // 2. Chỉnh sửa bài mẫu
        client.put("/api/admin/samples/" + sampleId, """
                {
                    "subjectCode": "math",
                    "topicName": "Chuyên đề mới tạo",
                    "title": "Tìm GTLN của hàm số (Đã sửa)",
                    "exerciseType": "Lời giải từng bước",
                    "prompt": "Tìm GTLN của y = -x^2 + 4x trên đoạn [0; 3]",
                    "modelSolution": "Đạo hàm: y' = -2x + 4 = 0 <=> x = 2.\\nTa có: y(0) = 0, y(2) = 4, y(3) = 3.\\nVậy max = 4 tại x = 2.",
                    "solutionNote": "Lưu ý kiểm tra nghiệm có thuộc đoạn đang xét.",
                    "sourceName": "Đề khảo sát cập nhật"
                }
                """).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Tìm GTLN của hàm số (Đã sửa)"))
                .andExpect(jsonPath("$.data.source").value("Đề khảo sát cập nhật"));

        // 3. Xóa bài mẫu
        client.delete("/api/admin/samples/" + sampleId)
                .andExpect(status().isOk());
    }
}
