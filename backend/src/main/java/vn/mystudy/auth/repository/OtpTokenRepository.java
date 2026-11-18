package vn.mystudy.auth.repository;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.auth.entity.OtpToken;
import java.util.UUID;

public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {

    Optional<OtpToken> findFirstByEmailAndPurposeAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, String purpose, Instant now);

    void deleteByEmailAndPurpose(String email, String purpose);
}
