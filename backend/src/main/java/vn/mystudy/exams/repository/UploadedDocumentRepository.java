package vn.mystudy.exams.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.exams.entity.UploadedDocument;

public interface UploadedDocumentRepository extends JpaRepository<UploadedDocument, UUID> {
}
