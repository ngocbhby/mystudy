package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "exams")
public class Exam {

    @Id
    private UUID id;

    @Column(name = "subject_code")
    private String subjectCode;

    private String title;

    private String kind;

    @Column(name = "exam_year")
    @JdbcTypeCode(SqlTypes.SMALLINT)
    private Integer examYear;

    @Column(name = "duration_minutes")
    private int durationMinutes;

    @Column(name = "source_name")
    private String sourceName;

    @Column(name = "paper_url")
    private String paperUrl;

    @Column(name = "answer_guide_url")
    private String answerGuideUrl;

    protected Exam() {}

    public Exam(UUID id, String subjectCode, String title, String kind, Integer examYear,
                int durationMinutes, String sourceName, String paperUrl, String answerGuideUrl) {
        this.id = id;
        this.subjectCode = subjectCode;
        this.title = title;
        this.kind = kind;
        this.examYear = examYear;
        this.durationMinutes = durationMinutes;
        this.sourceName = sourceName;
        this.paperUrl = paperUrl;
        this.answerGuideUrl = answerGuideUrl;
    }

    public UUID getId() {
        return id;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public String getTitle() {
        return title;
    }

    public String getKind() {
        return kind;
    }

    public Integer getExamYear() {
        return examYear;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getSourceName() {
        return sourceName;
    }

    public String getPaperUrl() {
        return paperUrl;
    }

    public String getAnswerGuideUrl() {
        return answerGuideUrl;
    }

    public void update(String title, String subjectCode, Integer examYear, Integer durationMinutes,
            String sourceName, String paperUrl, String answerGuideUrl) {
        if (title != null && !title.isBlank()) {
            this.title = title.trim();
        }
        if (subjectCode != null && !subjectCode.isBlank()) {
            this.subjectCode = subjectCode.trim().toLowerCase();
        }
        if (examYear != null) {
            this.examYear = examYear;
        }
        if (durationMinutes != null && durationMinutes > 0) {
            this.durationMinutes = durationMinutes;
        }
        if (sourceName != null && !sourceName.isBlank()) {
            this.sourceName = sourceName.trim();
        }
        if (paperUrl != null && !paperUrl.isBlank()) {
            this.paperUrl = paperUrl.trim();
        }
        if (answerGuideUrl != null && !answerGuideUrl.isBlank()) {
            this.answerGuideUrl = answerGuideUrl.trim();
        }
    }
}
