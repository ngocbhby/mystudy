package vn.mystudy.security;

import java.util.Locale;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import vn.mystudy.auth.entity.Profile;
import vn.mystudy.auth.repository.ProfileRepository;

@Service
class ProfileUserDetailsService implements UserDetailsService, UserDetailsPasswordService {

    private final ProfileRepository profiles;

    ProfileUserDetailsService(ProfileRepository profiles) {
        this.profiles = profiles;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalizedEmail = username.trim().toLowerCase(Locale.ROOT);
        Profile profile = profiles.findPasswordProfile(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown account"));

        // Quyền lấy từ CSDL, không suy ra từ email (email đăng ký bằng mật khẩu chưa được xác minh).
        return new AppUserDetails(profile.getId(), normalizedEmail, profile.getPasswordHash(), profile.getRole());
    }

    @Override
    public UserDetails updatePassword(UserDetails user, String newPassword) {
        String normalizedEmail = user.getUsername().trim().toLowerCase(Locale.ROOT);
        Profile profile = profiles.findPasswordProfile(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown account"));
        profile.changePasswordHash(newPassword);
        profiles.saveAndFlush(profile);
        return new AppUserDetails(profile.getId(), normalizedEmail, newPassword, profile.getRole());
    }
}
