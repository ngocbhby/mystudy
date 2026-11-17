package vn.mystudy.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "google_sub")
    private String googleSub;

    private String email;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "role")
    private String role = "USER";

    protected Profile() {}

    public static Profile withPassword(String email, String passwordHash) {
        Profile profile = new Profile();
        profile.email = email;
        profile.passwordHash = passwordHash;
        return profile;
    }

    public static Profile fromGoogle(String googleSub, String email, String displayName) {
        Profile profile = new Profile();
        profile.googleSub = googleSub;
        profile.email = email;
        profile.displayName = displayName;
        return profile;
    }

    public void updateFromGoogle(String email, String displayName) {
        this.email = email;
        this.displayName = displayName;
    }

    public void linkGoogle(String googleSub, String email, String displayName) {
        this.googleSub = googleSub;
        this.email = email;
        if (displayName != null && !displayName.isBlank() && (this.displayName == null || this.displayName.isBlank())) {
            this.displayName = displayName;
        }
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getRole() {
        return role != null ? role : "USER";
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
