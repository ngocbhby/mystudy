package vn.mystudy.samples.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import vn.mystudy.study.entity.Topic;

@Entity
@Table(name = "worked_examples")
public class WorkedExample {

    @Id
    private UUID id;

    @Column(name = "subject_code")
    private String subjectCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    private String title;

    @Column(name = "exercise_type")
    private String exerciseType;

    private String prompt;

    @Column(name = "model_solution")
    private String modelSolution;

    @Column(name = "solution_note")
    private String solutionNote;

    @Column(name = "source_name")
    private String sourceName;

    protected WorkedExample() {}

    public static WorkedExample create(UUID id, String subjectCode, Topic topic, String title,
            String exerciseType, String prompt, String modelSolution, String solutionNote, String sourceName) {
        WorkedExample example = new WorkedExample();
        example.id = id != null ? id : UUID.randomUUID();
        example.subjectCode = subjectCode;
        example.topic = topic;
        example.title = title;
        example.exerciseType = exerciseType;
        example.prompt = prompt;
        example.modelSolution = modelSolution;
        example.solutionNote = solutionNote;
        example.sourceName = sourceName;
        return example;
    }

    public void update(String subjectCode, Topic topic, String title,
            String exerciseType, String prompt, String modelSolution, String solutionNote, String sourceName) {
        this.subjectCode = subjectCode;
        this.topic = topic;
        this.title = title;
        this.exerciseType = exerciseType;
        this.prompt = prompt;
        this.modelSolution = modelSolution;
        this.solutionNote = solutionNote;
        this.sourceName = sourceName;
    }

    public UUID getId() {
        return id;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public Topic getTopic() {
        return topic;
    }

    public String getTitle() {
        return title;
    }

    public String getExerciseType() {
        return exerciseType;
    }

    public String getPrompt() {
        return prompt;
    }

    public String getModelSolution() {
        return modelSolution;
    }

    public String getSolutionNote() {
        return solutionNote;
    }

    public String getSourceName() {
        return sourceName;
    }
}
