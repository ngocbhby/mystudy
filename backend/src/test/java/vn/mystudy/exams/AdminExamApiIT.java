package vn.mystudy.exams;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.auth.repository.ProfileRepository;
import vn.mystudy.support.IntegrationTest;
import vn.mystudy.support.TestClient;

class AdminExamApiIT extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ProfileRepository profiles;

    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    /** Quản trị viên thật chỉ được cấp qua Google; trong test, cấp quyền trực tiếp trong CSDL rồi đăng nhập. */
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

    @Test
    void registeringWithTheAdminEmailDoesNotGrantAdmin() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        // app.admin-email = admin@mystudy.test trong cấu hình test; email đăng ký chưa xác minh nên không được quyền.
        String email = profiles.findPasswordProfile("admin@mystudy.test").isPresent()
                ? "Admin@MyStudy.test" : "admin@mystudy.test";
        var register = client.post("/api/auth/register",
                "{\"email\":\"" + email + "\",\"password\":\"user-password-123\"}");
        if (register.andReturn().getResponse().getStatus() == 201) {
            register.andExpect(jsonPath("$.data.role").value("USER"));
        } else {
            client.post("/api/auth/login", "{\"email\":\"" + email + "\",\"password\":\"user-password-123\"}")
                    .andExpect(status().isOk());
        }
        client.get("/api/admin/exams").andExpect(status().isForbidden());
        client.get("/api/session").andExpect(jsonPath("$.data.user.role").value("USER"));
    }

    @Test
    void uploadRejectsFilesThatAreNotRealPdfs() throws Exception {
        TestClient client = adminClient();
        org.springframework.mock.web.MockMultipartFile html = new org.springframework.mock.web.MockMultipartFile(
                "file", "de-thi.pdf", "text/html",
                "<html><script>alert(1)</script></html>".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        client.multipart(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .multipart("/api/admin/exams/upload-pdf").file(html))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthenticatedAccessIsDenied() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/admin/exams").andExpect(status().isUnauthorized());
    }

    @Test
    void normalUserAccessIsForbidden() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        String email = "user-" + UUID.randomUUID() + "@example.com";
        client.post("/api/auth/register",
                "{\"email\":\"" + email + "\",\"password\":\"user-password-123\"}")
                .andExpect(status().isCreated());

        client.get("/api/admin/exams").andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateAndListAndPostAndDeleteExam() throws Exception {
        TestClient client = adminClient();

        // 1. Xem danh sách đề thi
        client.get("/api/admin/exams")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        // 2. Tạo đề PDF mới
        String createPdfPayload = """
                {
                    "subjectCode": "math",
                    "title": "Đề thi thử THPT Quốc gia 2026 môn Toán",
                    "kind": "past_paper",
                    "examYear": 2026,
                    "durationMinutes": 90,
                    "sourceName": "Sở GD&ĐT Hà Nội",
                    "paperUrl": "/tai-lieu/toan-2026.pdf",
                    "answerGuideUrl": "/tai-lieu/toan-2026.pdf#page=5"
                }
                """;

        var res = client.post("/api/admin/exams", createPdfPayload)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Đề thi thử THPT Quốc gia 2026 môn Toán"))
                .andExpect(jsonPath("$.data.kind").value("past_paper"))
                .andReturn();

        String createdId = JsonPath.read(res.getResponse().getContentAsString(), "$.data.id");

        // 2.5 Cập nhật tiêu đề đề thi
        String updatePayload = """
                {
                    "title": "Đề thi thử THPT Quốc gia 2026 môn Toán (Đã cập nhật)",
                    "subjectCode": "math",
                    "examYear": 2026,
                    "durationMinutes": 90
                }
                """;
        client.put("/api/admin/exams/" + createdId, updatePayload)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Đề thi thử THPT Quốc gia 2026 môn Toán (Đã cập nhật)"));

        // 3. Xóa đề vừa tạo
        client.delete("/api/admin/exams/" + createdId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deleted").value(true));
    }

    @Test
    void adminCanCreateInteractivePracticeExam() throws Exception {
        TestClient client = adminClient();

        String createPracticePayload = """
                {
                    "subjectCode": "physics",
                    "title": "Luyện tập Vật lí hạt nhân",
                    "kind": "mystudy_practice",
                    "examYear": 2026,
                    "durationMinutes": 30,
                    "sourceName": "MyStudy biên soạn",
                    "questions": [
                        {
                            "prompt": "Hạt nhân nguyên tử cấu tạo từ gì?",
                            "options": ["Proton và neutron", "Electron", "Chỉ proton", "Photon"],
                            "correctOptionNumber": 1
                        },
                        {
                            "prompt": "Đơn vị khối lượng nguyên tử u xấp xỉ bằng khối lượng của?",
                            "options": ["Electron", "1/12 khối lượng đồng vị cacbon-12", "Hạt photon", "Neutrino"],
                            "correctOptionNumber": 2
                        }
                    ]
                }
                """;

        var res = client.post("/api/admin/exams", createPracticePayload)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Luyện tập Vật lí hạt nhân"))
                .andExpect(jsonPath("$.data.questionCount").value(2))
                .andReturn();

        String examId = JsonPath.read(res.getResponse().getContentAsString(), "$.data.id");

        // Kiểm tra xem đề thi trực tuyến có thể truy cập công khai qua /api/exams/{id} không
        client.get("/api/exams/" + examId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions.length()").value(2));

        // Dọn dẹp
        client.delete("/api/admin/exams/" + examId)
                .andExpect(status().isOk());
    }

    @Test
    void adminCanUploadPdfAndRetrieveIt() throws Exception {
        TestClient client = adminClient();

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file",
                "toan-2026.pdf",
                "application/pdf",
                "%PDF-1.4 Mock Binary PDF Content".getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        var res = client.multipart(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/admin/exams/upload-pdf").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").exists())
                .andReturn();

        String url = JsonPath.read(res.getResponse().getContentAsString(), "$.data.url");
        org.assertj.core.api.Assertions.assertThat(url).startsWith("/api/documents/");

        // Kiểm tra truy cập công khai không cần đăng nhập
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Type", org.hamcrest.Matchers.startsWith("application/pdf")));
    }
}
