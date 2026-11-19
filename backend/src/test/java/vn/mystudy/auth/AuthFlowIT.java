package vn.mystudy.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.UUID;
import org.bouncycastle.crypto.generators.SCrypt;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import vn.mystudy.support.IntegrationTest;
import vn.mystudy.support.TestClient;

class AuthFlowIT extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired vn.mystudy.auth.service.AuthService authService;

    private static String email() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private static String credentials(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    void anonymousSessionHasNoUserAndIssuesCsrfCookie() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user").doesNotExist())
                .andExpect(jsonPath("$.data.googleEnabled").value(true));
        assertThat(client.cookie("XSRF-TOKEN")).isNotNull();
    }

    @Test
    void postWithoutCsrfTokenIsRejectedWithEnvelope() throws Exception {
        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        client.postWithoutCsrf("/api/auth/login", credentials("a@example.com", "whatever-password"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void registerLoginLogoutRoundTrip() throws Exception {
        TestClient client = new TestClient(mvc);
        String email = email();
        client.get("/api/session");

        client.post("/api/auth/register", credentials(email, "a-long-password-123"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value(email));
        client.get("/api/session").andExpect(jsonPath("$.data.user.email").value(email));

        client.post("/api/auth/logout", "{}").andExpect(status().isNoContent());
        client.get("/api/session").andExpect(jsonPath("$.data.user").doesNotExist());

        client.post("/api/auth/login", credentials(email, "wrong-password-123"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"));
        client.post("/api/auth/login", credentials(email, "a-long-password-123"))
                .andExpect(status().isOk());
        client.get("/api/session").andExpect(jsonPath("$.data.user.email").value(email));
    }

    @Test
    void registrationValidatesPasswordLengthAndRejectsDuplicates() throws Exception {
        TestClient client = new TestClient(mvc);
        String email = email();
        client.get("/api/session");
        client.post("/api/auth/register", credentials(email, "short"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.password").exists());

        client.post("/api/auth/register", credentials(email, "a-long-password-123")).andExpect(status().isCreated());
        TestClient other = new TestClient(mvc);
        other.get("/api/session");
        other.post("/api/auth/register", credentials(email.toUpperCase(), "another-long-password"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void registrationValidatesConfirmPasswordWhenProvided() throws Exception {
        TestClient client = new TestClient(mvc);
        String email = email();
        client.get("/api/session");

        String mismatched = "{\"email\":\"" + email + "\",\"password\":\"a-long-password-123\",\"confirmPassword\":\"different-pass-456\"}";
        client.post("/api/auth/register", mismatched)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.confirmPassword").value("Mật khẩu xác nhận không khớp."));

        String matched = "{\"email\":\"" + email + "\",\"password\":\"a-long-password-123\",\"confirmPassword\":\"a-long-password-123\"}";
        client.post("/api/auth/register", matched)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value(email));
    }

    @Test
    void resetPasswordFlowUpdatesPasswordAndAllowsLogin() throws Exception {
        TestClient client = new TestClient(mvc);
        String email = email();
        client.get("/api/session");

        // 1. Tạo tài khoản ban đầu
        client.post("/api/auth/register", credentials(email, "initial-password-123"))
                .andExpect(status().isCreated());

        // 2. Thử đặt lại với confirm password không khớp
        String mismatched = "{\"email\":\"" + email + "\",\"newPassword\":\"new-password-123456\",\"confirmPassword\":\"wrong-password-999\"}";
        client.post("/api/auth/reset-password", mismatched)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        // 3. Đặt lại với email không tồn tại
        String nonExistent = "{\"email\":\"non-existent-" + UUID.randomUUID() + "@example.com\",\"newPassword\":\"new-password-123456\",\"confirmPassword\":\"new-password-123456\"}";
        client.post("/api/auth/reset-password", nonExistent)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        // 4. Đặt lại mật khẩu thành công
        String validReset = "{\"email\":\"" + email + "\",\"newPassword\":\"new-password-123456\",\"confirmPassword\":\"new-password-123456\"}";
        client.post("/api/auth/reset-password", validReset)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 5. Mật khẩu cũ không đăng nhập được nữa
        client.post("/api/auth/login", credentials(email, "initial-password-123"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"));

        // 6. Mật khẩu mới đăng nhập thành công
        client.post("/api/auth/login", credentials(email, "new-password-123456"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email));
    }

    @Test
    void repeatedFailuresForOneEmailAreThrottled() throws Exception {
        TestClient client = new TestClient(mvc);
        String email = email();
        client.get("/api/session");
        for (int i = 0; i < 5; i++) {
            client.post("/api/auth/login", credentials(email, "wrong-password-123")).andExpect(status().isUnauthorized());
        }
        client.post("/api/auth/login", credentials(email, "wrong-password-123"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void legacyScryptHashesStillWorkAndAreUpgradedToArgon2() throws Exception {
        String email = email();
        String password = "legacy-password-from-node";
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        byte[] key = SCrypt.generate(password.getBytes(StandardCharsets.UTF_8), salt, 1 << 17, 8, 1, 64);
        String legacy = "{legacyscrypt}scrypt:" + HexFormat.of().formatHex(salt) + ":" + HexFormat.of().formatHex(key);
        jdbc.update("insert into profiles (email, password_hash) values (?, ?)", email, legacy);

        TestClient client = new TestClient(mvc);
        client.get("/api/session");
        client.post("/api/auth/login", credentials(email, password)).andExpect(status().isOk());

        String stored = jdbc.queryForObject("select password_hash from profiles where email = ?", String.class, email);
        assertThat(stored).startsWith("{argon2}");
    }

    @Test
    void googleSignInDoesNotTakeOverAnUnverifiedPasswordAccount() throws Exception {
        // Kẻ xấu đăng ký trước bằng email của người khác (email không được xác minh).
        TestClient attacker = new TestClient(mvc);
        String email = email();
        attacker.get("/api/session");
        attacker.post("/api/auth/register", credentials(email, "a-long-password-123")).andExpect(status().isCreated());
        UUID attackerProfile = jdbc.queryForObject("select id from profiles where email = ?", UUID.class, email);

        // Chủ thật của email đăng nhập Google: phải nhận hồ sơ riêng, không dùng chung hồ sơ của kẻ xấu.
        UUID googleProfile = authService.linkGoogleAccount("google-sub-" + UUID.randomUUID(), email, "Học sinh");

        assertThat(googleProfile).isNotEqualTo(attackerProfile);
        String sub = jdbc.queryForObject("select google_sub from profiles where id = ?", String.class, attackerProfile);
        assertThat(sub).isNull();
    }
}
