package vn.mystudy.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/** Người dùng Google đã được ánh xạ vào bảng {@code profiles}. */
public final class ProfileOidcUser extends DefaultOidcUser implements ProfilePrincipal {

    private static final long serialVersionUID = 1L;

    private final UUID profileId;
    private final String role;

    public ProfileOidcUser(UUID profileId, OidcUser source) {
        this(profileId, "USER", source);
    }

    public ProfileOidcUser(UUID profileId, String role, OidcUser source) {
        super(enhanceAuthorities(source.getAuthorities(), role), source.getIdToken(), source.getUserInfo(), "sub");
        this.profileId = profileId;
        this.role = role != null ? role.toUpperCase() : "USER";
    }

    @Override
    public UUID profileId() {
        return profileId;
    }

    public String role() {
        return role;
    }

    private static Collection<? extends GrantedAuthority> enhanceAuthorities(
            Collection<? extends GrantedAuthority> base, String role) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        if (base != null) {
            authorities.addAll(base);
        }
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        if ("ADMIN".equalsIgnoreCase(role)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return Set.copyOf(authorities);
    }
}
