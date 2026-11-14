package vn.mystudy.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.mystudy.common.exception.TooManyRequestsException;

/**
 * Chỉ để kiểm tra mật khẩu do bản Node.js băm: {@code scrypt:<salt hex>:<key hex>} với N=2^17, r=8, p=1.
 * Không dùng để băm mật khẩu mới; sau lần đăng nhập đúng Spring Security nâng cấp lên Argon2.
 */
final class LegacyScryptPasswordEncoder implements PasswordEncoder {

    private static final int N = 1 << 17;
    private static final int R = 8;
    private static final int P = 1;

    /** Mỗi lần băm cần ~128 MiB heap; chỉ cho chạy một lần tại một thời điểm để vừa máy 512 MB. */
    private static final Semaphore MEMORY_PERMIT = new Semaphore(1);

    @Override
    public String encode(CharSequence rawPassword) {
        throw new UnsupportedOperationException("Mật khẩu mới được băm bằng Argon2.");
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        String[] parts = encodedPassword == null ? new String[0] : encodedPassword.split(":");
        if (parts.length != 3 || !"scrypt".equals(parts[0])) return false;
        try {
            if (!MEMORY_PERMIT.tryAcquire(5, TimeUnit.SECONDS)) throw new TooManyRequestsException(5);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TooManyRequestsException(5);
        }
        try {
            HexFormat hex = HexFormat.of();
            byte[] salt = hex.parseHex(parts[1]);
            byte[] expected = hex.parseHex(parts[2]);
            if (expected.length == 0 || expected.length > 128) return false;
            byte[] actual = SCrypt.generate(rawPassword.toString().getBytes(StandardCharsets.UTF_8), salt, N, R, P,
                    expected.length);
            return MessageDigest.isEqual(actual, expected);
        } catch (IllegalArgumentException e) {
            return false;
        } finally {
            MEMORY_PERMIT.release();
        }
    }

    @Override
    public boolean upgradeEncoding(String encodedPassword) {
        return true;
    }
}
