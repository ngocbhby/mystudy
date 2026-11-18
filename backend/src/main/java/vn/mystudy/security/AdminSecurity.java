package vn.mystudy.security;

import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public final class AdminSecurity {

    private AdminSecurity() {}

    public static Set<String> parseAdminEmails(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(raw.split("[,;\\s]+"))
                .map(String::trim)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    public static boolean isAdmin(String email, Set<String> adminEmails) {
        if (email == null || email.isBlank() || adminEmails == null || adminEmails.isEmpty()) {
            return false;
        }
        return adminEmails.contains(email.trim().toLowerCase(Locale.ROOT));
    }
}
