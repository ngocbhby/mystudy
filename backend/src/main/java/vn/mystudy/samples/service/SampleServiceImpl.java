package vn.mystudy.samples.service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.samples.dto.SampleListResponse;
import vn.mystudy.samples.dto.TopicOption;
import vn.mystudy.samples.entity.WorkedExample;
import vn.mystudy.samples.mapper.SampleMapper;
import vn.mystudy.samples.repository.WorkedExampleRepository;
import vn.mystudy.study.StudyCatalog;

@Service
@Transactional(readOnly = true)
class SampleServiceImpl implements SampleService {

    private final WorkedExampleRepository samples;
    private final SampleMapper mapper;

    SampleServiceImpl(WorkedExampleRepository samples, SampleMapper mapper) {
        this.samples = samples;
        this.mapper = mapper;
    }

    @Override
    public SampleListResponse list(String subject, UUID topicId) {
        if (subject != null && !subject.isBlank() && !StudyCatalog.SUBJECTS.containsKey(subject)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Bộ lọc bài mẫu không hợp lệ.");
        }
        Specification<WorkedExample> filter = (root, query, cb) -> cb.conjunction();
        if (subject != null && !subject.isBlank()) {
            filter = filter.and((root, query, cb) -> cb.equal(root.get("subjectCode"), subject));
        }
        if (topicId != null) {
            filter = filter.and((root, query, cb) -> cb.equal(root.get("topic").get("id"), topicId));
        }

        List<WorkedExample> filtered = samples.findAll(filter, Sort.by("subjectCode", "title"));
        List<WorkedExample> all = samples.findAll();

        Map<UUID, TopicOption> topics = new LinkedHashMap<>();
        all.stream().sorted(Comparator.comparing((WorkedExample s) -> s.getTopic().getName()))
                .forEach(s -> topics.putIfAbsent(s.getTopic().getId(), mapper.toTopicOption(s)));
        return new SampleListResponse(
                filtered.stream().map(mapper::toResponse).toList(),
                all.stream().map(WorkedExample::getSubjectCode).distinct().toList(),
                List.copyOf(topics.values()));
    }
}
