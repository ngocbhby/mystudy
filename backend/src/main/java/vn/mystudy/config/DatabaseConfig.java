package vn.mystudy.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chuyển {@code DATABASE_URL} dạng {@code postgres://user:pass@host/db} (Render, Heroku) sang JDBC
 * và bắt buộc TLS với máy chủ không phải localhost.
 */
@Configuration
class DatabaseConfig {

    private static final Set<String> LOCAL_HOSTS = Set.of("localhost", "127.0.0.1", "::1", "[::1]");

    @Bean
    @ConditionalOnExpression("!'${app.database-url:}'.isBlank()")
    DataSource dataSource(AppProperties properties) {
        HikariConfig config = toHikariConfig(properties.databaseUrl());
        config.setMaximumPoolSize(5);
        config.setConnectionTimeout(5_000);
        config.setPoolName("mystudy");
        return new HikariDataSource(config);
    }

    static HikariConfig toHikariConfig(String databaseUrl) {
        HikariConfig config = new HikariConfig();
        if (databaseUrl.startsWith("jdbc:")) {
            config.setJdbcUrl(databaseUrl);
            return config;
        }
        URI uri = URI.create(databaseUrl);
        if (!"postgres".equals(uri.getScheme()) && !"postgresql".equals(uri.getScheme())) {
            throw new IllegalStateException("DATABASE_URL phải bắt đầu bằng postgres:// hoặc postgresql://");
        }
        String host = uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String query = uri.getRawQuery() == null ? "" : uri.getRawQuery();
        if (!LOCAL_HOSTS.contains(host) && !query.contains("sslmode=")) {
            query = query.isEmpty() ? "sslmode=require" : query + "&sslmode=require";
        }
        config.setJdbcUrl("jdbc:postgresql://" + host + ":" + port + uri.getRawPath()
                + (query.isEmpty() ? "" : "?" + query));
        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            int colon = userInfo.indexOf(':');
            config.setUsername(decode(colon < 0 ? userInfo : userInfo.substring(0, colon)));
            if (colon >= 0) config.setPassword(decode(userInfo.substring(colon + 1)));
        }
        return config;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
