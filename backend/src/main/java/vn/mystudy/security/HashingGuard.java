package vn.mystudy.security;

import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import vn.mystudy.common.exception.TooManyRequestsException;

/** Giới hạn số phép băm mật khẩu (tốn bộ nhớ) chạy đồng thời để một đợt yêu cầu không làm cạn RAM. */
@Component
public class HashingGuard {

    private final Semaphore permits = new Semaphore(2);

    public <T> T run(Supplier<T> work) {
        try {
            if (!permits.tryAcquire(3, TimeUnit.SECONDS)) throw new TooManyRequestsException(3);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TooManyRequestsException(3);
        }
        try {
            return work.get();
        } finally {
            permits.release();
        }
    }
}
