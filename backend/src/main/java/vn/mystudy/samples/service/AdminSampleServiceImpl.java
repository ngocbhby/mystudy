package vn.mystudy.samples.service;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.samples.dto.CreateSampleRequest;
import vn.mystudy.samples.dto.SampleResponse;
import vn.mystudy.samples.entity.WorkedExample;
import vn.mystudy.samples.mapper.SampleMapper;
import vn.mystudy.samples.repository.WorkedExampleRepository;
import vn.mystudy.study.entity.Topic;
import vn.mystudy.study.repository.TopicRepository;

@Service
@Transactional
public class AdminSampleServiceImpl implements AdminSampleService {

    private final WorkedExampleRepository sampleRepository;
    private final TopicRepository topicRepository;
    private final SampleMapper sampleMapper;

    public AdminSampleServiceImpl(WorkedExampleRepository sampleRepository, TopicRepository topicRepository,
            SampleMapper sampleMapper) {
        this.sampleRepository = sampleRepository;
        this.topicRepository = topicRepository;
        this.sampleMapper = sampleMapper;
    }

    @Override
    public SampleResponse create(CreateSampleRequest request) {
        Topic topic = resolveTopic(request.subjectCode(), request.topicId(), request.topicName());
        WorkedExample example = WorkedExample.create(
                UUID.randomUUID(),
                request.subjectCode().trim().toLowerCase(),
                topic,
                request.title().trim(),
                request.exerciseType().trim(),
                request.prompt().trim(),
                request.modelSolution().trim(),
                request.solutionNote() != null ? request.solutionNote().trim() : null,
                request.sourceName().trim());

        WorkedExample saved = sampleRepository.save(example);
        return sampleMapper.toResponse(saved);
    }

    @Override
    public SampleResponse update(UUID id, CreateSampleRequest request) {
        WorkedExample example = sampleRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài mẫu cần chỉnh sửa."));

        Topic topic = resolveTopic(request.subjectCode(), request.topicId(), request.topicName());
        example.update(
                request.subjectCode().trim().toLowerCase(),
                topic,
                request.title().trim(),
                request.exerciseType().trim(),
                request.prompt().trim(),
                request.modelSolution().trim(),
                request.solutionNote() != null ? request.solutionNote().trim() : null,
                request.sourceName().trim());

        WorkedExample saved = sampleRepository.save(example);
        return sampleMapper.toResponse(saved);
    }

    @Override
    public void delete(UUID id) {
        WorkedExample example = sampleRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài mẫu cần xóa."));
        sampleRepository.delete(example);
    }

    private Topic resolveTopic(String subjectCode, UUID topicId, String topicName) {
        String normalizedSubject = subjectCode.trim().toLowerCase();
        if (topicId != null) {
            return topicRepository.findById(topicId)
                    .orElseThrow(() -> BusinessException.notFound("Chuyên đề được chọn không tồn tại."));
        }
        if (topicName != null && !topicName.isBlank()) {
            String trimmedName = topicName.trim();
            return topicRepository.findFirstBySubjectCodeAndName(normalizedSubject, trimmedName)
                    .orElseGet(() -> topicRepository.save(Topic.create(UUID.randomUUID(), normalizedSubject, trimmedName, null)));
        }
        return topicRepository.findBySubjectCodeOrderByName(normalizedSubject).stream().findFirst()
                .orElseGet(() -> topicRepository.save(Topic.create(UUID.randomUUID(), normalizedSubject, "Tổng hợp", null)));
    }
}
