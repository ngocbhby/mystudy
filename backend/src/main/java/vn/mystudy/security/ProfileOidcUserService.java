package vn.mystudy.security;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import vn.mystudy.auth.entity.Profile;
import vn.mystudy.auth.repository.ProfileRepository;
import vn.mystudy.auth.service.AuthService;

/** Tạo hoặc cập nhật hồ sơ theo định danh {@code sub} của Google; chỉ nhận email đã được Google xác minh. */
@Component
public class ProfileOidcUserService extends OidcUserService {

    private final AuthService authService;
    private final ProfileRepository profiles;
    private final Set<String> adminEmails;

    ProfileOidcUserService(AuthService authService, ProfileRepository profiles,
            @Value("${app.admin-email:ngocbhbymit@gmail.com, h.nam2k707@gmail.com, ductrung1232013@gmail.com}") String adminEmail) {
        this.authService = authService;
        this.profiles = profiles;
        this.adminEmails = AdminSecurity.parseAdminEmails(adminEmail);
    }

    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        OidcUser google = super.loadUser(request);
        String subject = google.getSubject();
        if (subject == null || subject.isBlank() || subject.length() > 255) {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_id_token"));
        }
        String email = Boolean.TRUE.equals(google.getEmailVerified()) ? google.getEmail() : null;
        UUID profileId = authService.linkGoogleAccount(subject, email, google.getFullName());

        String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : "";
        boolean isAdmin = AdminSecurity.isAdmin(normalizedEmail, adminEmails);
        String expectedRole = isAdmin ? "ADMIN" : "USER";

        Profile profile = profiles.findById(profileId).orElse(null);
        if (profile != null && !expectedRole.equalsIgnoreCase(profile.getRole())) {
            profile.setRole(expectedRole);
            profiles.saveAndFlush(profile);
        }

        return new ProfileOidcUser(profileId, expectedRole, google);
    }
}
