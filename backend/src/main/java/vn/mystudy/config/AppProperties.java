package vn.mystudy.config;

import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Cấu hình riêng của ứng dụng (tiền tố {@code app.*}). */
@ConfigurationProperties("app")
public record AppProperties(
        URI origin,
        String databaseUrl,
        String googleClientId,
        String googleClientSecret,
        int authAttemptsPerMinute,
        int failedLoginsPerEmail) {

    public boolean secureOrigin() {
        return "https".equalsIgnoreCase(origin.getScheme());
    }

    public boolean googleConfigured() {
        return googleClientId != null && !googleClientId.isBlank()
                && googleClientSecret != null && !googleClientSecret.isBlank();
    }
}
