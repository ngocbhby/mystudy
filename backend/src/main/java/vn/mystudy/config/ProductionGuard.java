package vn.mystudy.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Dừng khởi động nếu cấu hình production không an toàn. */
@Component
@Profile("prod")
class ProductionGuard {

    private final AppProperties properties;

    ProductionGuard(AppProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void verify() {
        if (!properties.secureOrigin()) {
            throw new IllegalStateException("APP_ORIGIN phải là địa chỉ HTTPS khi chạy production.");
        }
        if (properties.databaseUrl() == null || properties.databaseUrl().isBlank()) {
            throw new IllegalStateException("Thiếu DATABASE_URL.");
        }
    }
}
