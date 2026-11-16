package vn.mystudy.auth.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.mystudy.auth.entity.Profile;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByGoogleSub(String googleSub);

    Optional<Profile> findFirstByEmailIgnoreCase(String email);

    /** Chỉ tìm hồ sơ có mật khẩu: hồ sơ Google trùng email không được dùng để đăng nhập bằng email. */
    @Query("select p from Profile p where lower(p.email) = :email and p.passwordHash is not null")
    Optional<Profile> findPasswordProfile(@Param("email") String email);

    /** Khóa dòng hồ sơ để tuần tự hóa các lần lưu mục tiêu của cùng một tài khoản. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Profile p where p.id = :id")
    Optional<Profile> lockById(@Param("id") UUID id);
}
