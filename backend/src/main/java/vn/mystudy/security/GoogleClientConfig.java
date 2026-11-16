package vn.mystudy.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import vn.mystudy.config.AppProperties;

/** Chỉ đăng ký Google khi có đủ client id/secret; thiếu thì ứng dụng vẫn chạy với đăng nhập email. */
@Configuration
class GoogleClientConfig {

    static final String REGISTRATION_ID = "google";

    @Bean
    @ConditionalOnExpression("!'${app.google-client-id:}'.isBlank() && !'${app.google-client-secret:}'.isBlank()")
    ClientRegistrationRepository clientRegistrationRepository(AppProperties properties) {
        ClientRegistration google = CommonOAuth2Provider.GOOGLE.getBuilder(REGISTRATION_ID)
                .clientId(properties.googleClientId().trim())
                .clientSecret(properties.googleClientSecret().trim())
                .scope("openid", "email", "profile")
                .redirectUri(properties.origin().toString().replaceAll("/$", "") + "/api/auth/google/callback")
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }
}
