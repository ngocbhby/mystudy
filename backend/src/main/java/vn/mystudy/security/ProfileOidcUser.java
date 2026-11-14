package vn.mystudy.security;

import java.util.UUID;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/** Người dùng Google đã được ánh xạ vào bảng {@code profiles}. */
public final class ProfileOidcUser extends DefaultOidcUser implements ProfilePrincipal {

    private static final long serialVersionUID = 1L;

    private final UUID profileId;

    public ProfileOidcUser(UUID profileId, OidcUser source) {
        super(source.getAuthorities(), source.getIdToken(), source.getUserInfo(), "sub");
        this.profileId = profileId;
    }

    @Override
    public UUID profileId() {
        return profileId;
    }
}
