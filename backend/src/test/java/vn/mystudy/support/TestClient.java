package vn.mystudy.support;

import jakarta.servlet.http.Cookie;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/** Mô phỏng trình duyệt: giữ cookie (phiên, XSRF-TOKEN) và tự gửi header CSRF như frontend thật. */
public final class TestClient {

    private final MockMvc mvc;
    private final Map<String, Cookie> jar = new LinkedHashMap<>();

    public TestClient(MockMvc mvc) {
        this.mvc = mvc;
    }

    public ResultActions get(String url) throws Exception {
        return send(MockMvcRequestBuilders.get(url));
    }

    public ResultActions post(String url, String json) throws Exception {
        MockHttpServletRequestBuilder request = MockMvcRequestBuilders.post(url).contentType(MediaType.APPLICATION_JSON).content(json);
        Cookie xsrf = jar.get("XSRF-TOKEN");
        if (xsrf != null) request.header("X-XSRF-TOKEN", xsrf.getValue());
        return send(request);
    }

    /** POST kèm một header tùy chọn (ví dụ token lượt thi của khách). */
    public ResultActions post(String url, String json, String header, String value) throws Exception {
        MockHttpServletRequestBuilder request = MockMvcRequestBuilders.post(url).contentType(MediaType.APPLICATION_JSON).content(json);
        Cookie xsrf = jar.get("XSRF-TOKEN");
        if (xsrf != null) request.header("X-XSRF-TOKEN", xsrf.getValue());
        if (value != null) request.header(header, value);
        return send(request);
    }

    public ResultActions get(String url, String header, String value) throws Exception {
        MockHttpServletRequestBuilder request = MockMvcRequestBuilders.get(url);
        if (value != null) request.header(header, value);
        return send(request);
    }

    public ResultActions put(String url, String json) throws Exception {
        MockHttpServletRequestBuilder request = MockMvcRequestBuilders.put(url).contentType(MediaType.APPLICATION_JSON).content(json);
        Cookie xsrf = jar.get("XSRF-TOKEN");
        if (xsrf != null) request.header("X-XSRF-TOKEN", xsrf.getValue());
        return send(request);
    }

    public ResultActions delete(String url) throws Exception {
        MockHttpServletRequestBuilder request = MockMvcRequestBuilders.delete(url);
        Cookie xsrf = jar.get("XSRF-TOKEN");
        if (xsrf != null) request.header("X-XSRF-TOKEN", xsrf.getValue());
        return send(request);
    }

    public ResultActions multipart(org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder request) throws Exception {
        if (!jar.isEmpty()) request.cookie(jar.values().toArray(Cookie[]::new));
        Cookie xsrf = jar.get("XSRF-TOKEN");
        if (xsrf != null) request.header("X-XSRF-TOKEN", xsrf.getValue());
        ResultActions actions = mvc.perform(request);
        MvcResult result = actions.andReturn();
        for (Cookie cookie : result.getResponse().getCookies()) {
            if (cookie.getMaxAge() == 0) jar.remove(cookie.getName());
            else jar.put(cookie.getName(), cookie);
        }
        return actions;
    }

    /** Gửi POST không kèm header CSRF dù cookie đã có. */
    public ResultActions postWithoutCsrf(String url, String json) throws Exception {
        return send(MockMvcRequestBuilders.post(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    public Cookie cookie(String name) {
        return jar.get(name);
    }

    private ResultActions send(MockHttpServletRequestBuilder request) throws Exception {
        if (!jar.isEmpty()) request.cookie(jar.values().toArray(Cookie[]::new));
        ResultActions actions = mvc.perform(request);
        MvcResult result = actions.andReturn();
        for (Cookie cookie : result.getResponse().getCookies()) {
            if (cookie.getMaxAge() == 0) jar.remove(cookie.getName());
            else jar.put(cookie.getName(), cookie);
        }
        return actions;
    }
}
