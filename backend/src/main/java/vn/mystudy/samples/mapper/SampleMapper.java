package vn.mystudy.samples.mapper;

import org.springframework.stereotype.Component;
import vn.mystudy.samples.dto.SampleResponse;
import vn.mystudy.samples.dto.TopicOption;
import vn.mystudy.samples.entity.WorkedExample;

@Component
public class SampleMapper {

    public SampleResponse toResponse(WorkedExample sample) {
        return new SampleResponse(sample.getId(), sample.getTitle(), sample.getSubjectCode(), sample.getTopic().getId(),
                sample.getTopic().getName(), sample.getExerciseType(), sample.getPrompt(), sample.getModelSolution(),
                sample.getSolutionNote(), sample.getSourceName());
    }

    public TopicOption toTopicOption(WorkedExample sample) {
        return new TopicOption(sample.getTopic().getId(), sample.getTopic().getName(), sample.getSubjectCode());
    }
}
