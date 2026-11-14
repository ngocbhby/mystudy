package vn.mystudy.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;

/** Nhân dạng đã xác thực, bất kể đăng nhập bằng email hay Google. */
public interface ProfilePrincipal {

    UUID profileId();

    static Optional<UUID> idOf(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof ProfilePrincipal principal) {
            return Optional.of(principal.profileId());
        }
        return Optional.empty();
    }
}
