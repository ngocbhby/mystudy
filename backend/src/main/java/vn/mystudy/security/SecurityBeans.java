package vn.mystudy.security;

import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import vn.mystudy.config.AppProperties;

/** Các bean nền của lớp bảo mật; tách khỏi {@link SecurityConfig} để tránh phụ thuộc vòng với service. */
@Configuration
class SecurityBeans {

    @Bean
    AuthenticationManager authenticationManager(ProfileUserDetailsService users, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        provider.setUserDetailsPasswordService(users);
        return new ProviderManager(provider);
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    CsrfTokenRepository csrfTokenRepository(AppProperties properties) {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> cookie.path("/").sameSite("Lax").secure(properties.secureOrigin()));
        return repository;
    }

    @Bean
    RateLimiter ipRateLimiter(AppProperties properties) {
        return new RateLimiter(properties.authAttemptsPerMinute(), Duration.ofMinutes(1), 100_000);
    }

    @Bean
    RateLimiter failedLoginLimiter(AppProperties properties) {
        return new RateLimiter(properties.failedLoginsPerEmail(), Duration.ofMinutes(15), 100_000);
    }
}
