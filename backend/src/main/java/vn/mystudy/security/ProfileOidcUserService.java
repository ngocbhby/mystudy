package vn.mystudy.security;

import java.util.UUID;
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

    ProfileOidcUserService(AuthService authService, ProfileRepository profiles) {
        this.authService = authService;
        this.profiles = profiles;
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
        String role = profiles.findById(profileId).map(Profile::getRole).orElse("USER");
        return new ProfileOidcUser(profileId, role, google);
    }
}
