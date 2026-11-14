package vn.mystudy.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import vn.mystudy.support.IntegrationTest;

class SecurityHeadersIT extends IntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void apiResponsesAreHardenedAndNeverCached() throws Exception {
        mvc.perform(get("/api/session"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().exists("Permissions-Policy"))
                .andExpect(header().exists("X-Request-Id"))
                .andExpect(jsonPath("$.requestId").exists());
    }

    @Test
    void cspForbidsInlineScriptsAndFraming() throws Exception {
        String csp = mvc.perform(get("/api/session")).andReturn().getResponse().getHeader("Content-Security-Policy");
        assertThat(csp).contains("script-src 'self'").contains("frame-ancestors 'none'").contains("object-src 'none'");
        assertThat(csp).doesNotContain("script-src 'self' 'unsafe-inline'");
    }

    @Test
    void protectedAndUnknownApiRoutesReturnEnvelopeErrors() throws Exception {
        mvc.perform(get("/api/study/goal"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(get("/api/nope")).andExpect(status().isUnauthorized());
    }

    @Test
    void googleLoginRedirectUsesPkceStateAndNonce() throws Exception {
        MvcResult result = mvc.perform(get("/api/auth/oauth2/google")).andExpect(status().is3xxRedirection()).andReturn();
        String location = result.getResponse().getRedirectedUrl();
        assertThat(location).startsWith("https://accounts.google.com/")
                .contains("code_challenge=").contains("code_challenge_method=S256")
                .contains("state=").contains("nonce=")
                .contains("redirect_uri=http://localhost:5173/api/auth/google/callback");
    }

    @Test
    void headRequestsToStaticPathsAreNotBlockedByAuthorization() throws Exception {
        // 404 (không có file) chứ không phải 401/403 nghĩa là HEAD đã qua lớp phân quyền, như GET.
        mvc.perform(head("/assets/missing.js")).andExpect(status().isNotFound());
        mvc.perform(head("/api/study/goal")).andExpect(status().isUnauthorized());
    }
}
