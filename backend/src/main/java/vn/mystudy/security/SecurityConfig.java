package vn.mystudy.security;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.header.writers.DelegatingRequestMatcherHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import vn.mystudy.common.api.ErrorCode;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private static final String APP_CSP = String.join("; ",
            "default-src 'self'",
            "script-src 'self'",
            // MUI/Emotion chèn style động; script vẫn bị khóa chặt ở 'self'.
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'");

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, SecurityContextRepository contextRepository,
            CsrfTokenRepository csrfTokenRepository, ObjectProvider<ClientRegistrationRepository> clients,
            ProfileOidcUserService oidcUserService, RateLimiter ipRateLimiter,
            @Value("${server.servlet.session.cookie.name}") String sessionCookie) throws Exception {

        RequestMatcher api = PathPatternRequestMatcher.withDefaults().matcher("/api/**");
        RequestMatcher documents = PathPatternRequestMatcher.withDefaults().matcher("/tai-lieu/**");
        RequestMatcher uploads = PathPatternRequestMatcher.withDefaults().matcher("/uploads/**");
        RequestMatcher apiDocs = PathPatternRequestMatcher.withDefaults().matcher("/api/documents/**");
        RequestMatcher staticDocs = new org.springframework.security.web.util.matcher.OrRequestMatcher(documents, uploads, apiDocs);
        RequestMatcher nonDocumentApi = new org.springframework.security.web.util.matcher.AndRequestMatcher(
                api, new NegatedRequestMatcher(apiDocs));

        http
            .securityContext(c -> c.securityContextRepository(contextRepository))
            .csrf(c -> c.csrfTokenRepository(csrfTokenRepository)
                    .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
            .addFilterBefore(new AuthRateLimitFilter(ipRateLimiter), CsrfFilter.class)
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .headers(h -> h
                .contentTypeOptions(c -> { })
                .frameOptions(f -> f.deny())
                .cacheControl(c -> c.disable())
                .httpStrictTransportSecurity(s -> s.maxAgeInSeconds(31_536_000).includeSubDomains(true))
                .referrerPolicy(r -> r.policy(
                        org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                .addHeaderWriter(new DelegatingRequestMatcherHeaderWriter(new NegatedRequestMatcher(staticDocs),
                        new StaticHeadersWriter("Content-Security-Policy", APP_CSP)))
                // PDF hiển thị bằng trình xem của trình duyệt nên chỉ chặn bị nhúng khung.
                .addHeaderWriter(new DelegatingRequestMatcherHeaderWriter(staticDocs,
                        new StaticHeadersWriter("Content-Security-Policy", "frame-ancestors 'none'")))
                .addHeaderWriter(new DelegatingRequestMatcherHeaderWriter(nonDocumentApi,
                        new StaticHeadersWriter("Cache-Control", "no-store")))
                .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy",
                        "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                .addHeaderWriter(new StaticHeadersWriter("Cross-Origin-Opener-Policy", "same-origin"))
                .addHeaderWriter(new StaticHeadersWriter("Cross-Origin-Resource-Policy", "same-origin")))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers("/api/session", "/api/auth/**").permitAll()
                // Khóa đáp án chỉ dành cho quản trị; học sinh xem lời giải qua kết quả lượt thi đã nộp.
                .requestMatchers(HttpMethod.GET, "/api/exams/*/answers").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/exams", "/api/exams/**", "/api/samples", "/api/documents/**",
                        "/api/topics/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/exams/*/attempts/start",
                        "/api/exams/*/attempts/*/submit").permitAll()
                .requestMatchers("/api/ai/**").authenticated()
                .requestMatchers("/api/study/**").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").denyAll()
                .requestMatchers(HttpMethod.GET, "/**").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/**").permitAll()
                .anyRequest().denyAll())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> JsonResponses.write(res, ErrorCode.UNAUTHENTICATED))
                .accessDeniedHandler((req, res, ex) -> JsonResponses.write(res, ErrorCode.FORBIDDEN)))
            .logout(l -> l
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies(sessionCookie));

        ClientRegistrationRepository registrations = clients.getIfAvailable();
        if (registrations != null) {
            OAuth2AuthorizationRequestResolver resolver =
                    pkceResolver(registrations, "/api/auth/oauth2");
            http.oauth2Login(o -> o
                .authorizationEndpoint(a -> a.baseUri("/api/auth/oauth2").authorizationRequestResolver(resolver))
                .redirectionEndpoint(r -> r.baseUri("/api/auth/google/callback"))
                .userInfoEndpoint(u -> u.oidcUserService(oidcUserService))
                .successHandler((req, res, auth) -> res.sendRedirect("/"))
                .failureHandler((req, res, ex) -> redirectWithFailure(req.getParameter("error"), ex, res)));
        }
        return http.build();
    }

    private static OAuth2AuthorizationRequestResolver pkceResolver(ClientRegistrationRepository repository,
            String baseUri) {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(repository, baseUri);
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        return resolver;
    }

    private static void redirectWithFailure(String error, Exception ex, jakarta.servlet.http.HttpServletResponse res)
            throws IOException {
        boolean cancelled = "access_denied".equals(error);
        if (!cancelled) log.warn("Google sign-in failed ({}): {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        res.sendRedirect(cancelled ? "/?auth=cancelled" : "/?auth=failed");
    }
}
