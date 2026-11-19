package vn.mystudy.exams.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.exams.entity.UploadedDocument;
import vn.mystudy.exams.repository.UploadedDocumentRepository;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final UploadedDocumentRepository documents;

    public DocumentController(UploadedDocumentRepository documents) {
        this.documents = documents;
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> viewDocument(@PathVariable UUID id) {
        return serve(id);
    }

    @GetMapping("/{id}/{filename}")
    public ResponseEntity<byte[]> viewDocumentWithFilename(@PathVariable UUID id, @PathVariable String filename) {
        return serve(id);
    }

    private ResponseEntity<byte[]> serve(UUID id) {
        UploadedDocument doc = documents.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài liệu."));

        String encodedFilename = URLEncoder.encode(doc.getFilename(), StandardCharsets.UTF_8).replace("+", "%20");
        String contentDisposition = "inline; filename=\"" + doc.getFilename().replaceAll("\"", "") + "\"; filename*=UTF-8''" + encodedFilename;

        // Luôn trả về PDF: không phát lại Content-Type do người tải lên khai báo (tránh XSS qua file HTML).
        MediaType mediaType = MediaType.APPLICATION_PDF;

        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .contentType(mediaType)
                .contentLength(doc.getSizeBytes())
                .body(doc.getData());
    }
}
