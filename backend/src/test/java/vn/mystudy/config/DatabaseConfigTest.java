package vn.mystudy.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.zaxxer.hikari.HikariConfig;
import org.junit.jupiter.api.Test;

class DatabaseConfigTest {

    @Test
    void convertsRenderStyleUrlAndForcesTlsForRemoteHosts() {
        HikariConfig config = DatabaseConfig.toHikariConfig("postgresql://app:p%40ss@db.example.com/mystudy");
        assertThat(config.getJdbcUrl()).isEqualTo("jdbc:postgresql://db.example.com:5432/mystudy?sslmode=require");
        assertThat(config.getUsername()).isEqualTo("app");
        assertThat(config.getPassword()).isEqualTo("p@ss");
    }

    @Test
    void keepsExplicitSslModeAndDoesNotForceTlsOnLocalhost() {
        assertThat(DatabaseConfig.toHikariConfig("postgres://u:p@db.example.com:6543/x?sslmode=verify-full").getJdbcUrl())
                .isEqualTo("jdbc:postgresql://db.example.com:6543/x?sslmode=verify-full");
        assertThat(DatabaseConfig.toHikariConfig("postgres://u:p@localhost/x").getJdbcUrl())
                .isEqualTo("jdbc:postgresql://localhost:5432/x");
    }

    @Test
    void passesJdbcUrlsThrough() {
        assertThat(DatabaseConfig.toHikariConfig("jdbc:postgresql://h/db?user=u").getJdbcUrl())
                .isEqualTo("jdbc:postgresql://h/db?user=u");
    }
}
