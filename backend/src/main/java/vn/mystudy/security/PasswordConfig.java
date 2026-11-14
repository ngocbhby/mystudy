package vn.mystudy.security;

import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class PasswordConfig {

    /** Argon2id theo khuyến nghị OWASP (m=19 MiB, t=2, p=1). Mã băm tự mô tả tham số nên có thể tăng sau này. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new DelegatingPasswordEncoder("argon2", Map.of(
                "argon2", new Argon2PasswordEncoder(16, 32, 1, 19_456, 2),
                "legacyscrypt", new LegacyScryptPasswordEncoder()));
    }
}
