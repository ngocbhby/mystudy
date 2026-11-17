package vn.mystudy.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Người dùng đăng nhập bằng email và mật khẩu. Mã băm bị xóa khỏi bộ nhớ sau khi xác thực. */
public final class AppUserDetails implements UserDetails, CredentialsContainer, ProfilePrincipal {

    private static final long serialVersionUID = 1L;

    private final UUID id;
    private final String email;
    private final String role;
    private String passwordHash;

    public AppUserDetails(UUID id, String email, String passwordHash) {
        this(id, email, passwordHash, "USER");
    }

    public AppUserDetails(UUID id, String email, String passwordHash, String role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role != null ? role.toUpperCase() : "USER";
    }

    @Override
    public UUID profileId() {
        return id;
    }

    public String role() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        if ("ADMIN".equals(role)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return List.copyOf(authorities);
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public void eraseCredentials() {
        passwordHash = null;
    }
}
