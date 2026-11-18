package vn.mystudy.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Nhật ký sự kiện bảo mật (đăng nhập, đăng ký, bị giới hạn). Email luôn được che. */
public final class AuditLog {

    private static final Logger log = LoggerFactory.getLogger("AUDIT");

    private AuditLog() {}

    public static void loginSucceeded(String email) {
        log.info("login.success email={}", mask(email));
    }

    public static void loginFailed(String email) {
        log.warn("login.failure email={}", mask(email));
    }

    public static void loginBlocked(String email) {
        log.warn("login.blocked email={}", mask(email));
    }

    public static void registered(String email) {
        log.info("register.success email={}", mask(email));
    }

    public static void registerRejected(String email) {
        log.info("register.rejected email={}", mask(email));
    }

    public static void passwordReset(String email) {
        log.info("password.reset email={}", mask(email));
    }

    static String mask(String email) {
        if (email == null) return "-";
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at < 0 ? "" : email.substring(at));
        return email.charAt(0) + "***" + email.substring(at);
    }
}
