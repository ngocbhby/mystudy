package vn.mystudy.security;

import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.auth.entity.Profile;
import vn.mystudy.auth.repository.ProfileRepository;

/** Cầu nối giữa Spring Security và bảng profiles; tự nâng cấp mã băm cũ lên Argon2 sau khi đăng nhập đúng. */
@Service
class ProfileUserDetailsService implements UserDetailsService, UserDetailsPasswordService {

    private final ProfileRepository profiles;
    private final String adminEmail;

    ProfileUserDetailsService(ProfileRepository profiles,
            @Value("${app.admin-email:ngocbhbymit@gmail.com}") String adminEmail) {
        this.profiles = profiles;
        this.adminEmail = adminEmail != null ? adminEmail.trim().toLowerCase(Locale.ROOT) : "";
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        Profile profile = profiles.findPasswordProfile(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown account"));

        boolean isAdmin = !adminEmail.isBlank() && normalizedEmail.equals(adminEmail);
        String expectedRole = isAdmin ? "ADMIN" : "USER";
        if (!expectedRole.equalsIgnoreCase(profile.getRole())) {
            profile.setRole(expectedRole);
            profiles.saveAndFlush(profile);
        }

        return new AppUserDetails(profile.getId(), normalizedEmail, profile.getPasswordHash(), expectedRole);
    }

    @Override
    @Transactional
    public UserDetails updatePassword(UserDetails user, String newPassword) {
        AppUserDetails principal = (AppUserDetails) user;
        profiles.findById(principal.profileId()).ifPresent(p -> p.changePasswordHash(newPassword));
        return new AppUserDetails(principal.profileId(), principal.getUsername(), newPassword, principal.role());
    }
}
