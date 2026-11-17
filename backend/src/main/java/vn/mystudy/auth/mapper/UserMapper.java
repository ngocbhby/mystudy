package vn.mystudy.auth.mapper;

import org.springframework.stereotype.Component;
import vn.mystudy.auth.dto.UserResponse;
import vn.mystudy.auth.entity.Profile;

@Component
public class UserMapper {

    public UserResponse toResponse(Profile profile) {
        return new UserResponse(profile.getId(), profile.getEmail(), profile.getDisplayName(), profile.getRole());
    }
}
