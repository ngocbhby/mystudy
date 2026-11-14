package vn.mystudy.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/**
 * Chạy PostgreSQL nhúng ở cổng 54329 để phát triển cục bộ khi chưa cài PostgreSQL:
 * {@code ./mvnw -q test-compile exec:java -Dexec.mainClass=vn.mystudy.support.DevDatabase -Dexec.classpathScope=test}
 */
public final class DevDatabase {

    private DevDatabase() {}

    public static void main(String[] args) throws Exception {
        try (EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(54329).start()) {
            System.out.println("DATABASE_URL=postgresql://postgres@localhost:" + postgres.getPort() + "/postgres");
            Thread.currentThread().join();
        }
    }
}
