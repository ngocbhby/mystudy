package vn.mystudy.study.dto;

import java.util.UUID;

public record PlanResponse(UUID id, String startsOn, String strategy) {
}
