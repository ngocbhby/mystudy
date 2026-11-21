package vn.mystudy.exams.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.mystudy.ai.AiGateway;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.exams.dto.ConvertedExamQuestions;
import vn.mystudy.exams.dto.ConvertedExamQuestions.ConvertedQuestionItem;

@Service
public class ExamAiConversionService {

    private static final Logger log = LoggerFactory.getLogger(ExamAiConversionService.class);
    private final AiGateway aiGateway;

    public ExamAiConversionService(AiGateway aiGateway) {
        this.aiGateway = aiGateway;
    }

    public List<ConvertedQuestionItem> convertPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "File PDF không được để trống.");
        }
        String text;
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            text = stripper.getText(document);
        } catch (IOException e) {
            log.error("Không thể đọc nội dung file PDF", e);
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể đọc nội dung từ file PDF. Vui lòng kiểm tra định dạng file.");
        }

        if (text == null || text.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "File PDF không chứa văn bản hoặc là file scan dạng ảnh.");
        }

        return convertText(text);
    }

    public List<ConvertedQuestionItem> convertText(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Nội dung đề thi không được để trống.");
        }

        if (aiGateway != null && aiGateway.enabled()) {
            try {
                String systemPrompt = """
                        Bạn là trợ lý AI chuyên gia bóc tách và số hóa đề thi THPT của Việt Nam.
                        Nhiệm vụ của bạn là đọc toàn bộ văn bản đề thi trắc nghiệm được cung cấp và trích xuất thành danh sách các câu hỏi hoàn chỉnh.

                        Yêu cầu nghiêm ngặt:
                        1. Mỗi câu hỏi phải có:
                           - prompt: Nội dung câu hỏi (giữ nguyên công thức toán, văn bản, các câu dẫn).
                           - options: Mảng đúng 4 phần tử tương ứng với 4 đáp án A, B, C, D (ví dụ: ["A. ...", "B. ...", "C. ...", "D. ..."]).
                           - correctOptionNumber: Số từ 1 đến 4 (1=A, 2=B, 3=C, 4=D). Nếu trong đề có đáp án in đậm, gạch chân hoặc có bảng đáp án ở cuối đề, hãy đối chiếu để điền chính xác. Nếu đề không có đáp án, hãy tự giải hoặc mặc định là 1.
                           - explanation: Lời giải ngắn gọn nếu có trong tài liệu hoặc phương pháp giải.
                        2. Giữ nguyên thứ tự các câu trong đề thi (Câu 1, Câu 2,...).
                        """;

                String userPrompt = "Dưới đây là văn bản trích xuất từ đề thi:\n\n" + rawText;
                ConvertedExamQuestions result = aiGateway.generate(systemPrompt, userPrompt, ConvertedExamQuestions.class, 8192);
                if (result != null && result.questions() != null && !result.questions().isEmpty()) {
                    return result.questions();
                }
            } catch (Exception e) {
                log.warn("AI conversion call failed, falling back to rule-based parser: {}", e.getMessage());
            }
        }

        return parseByRegex(rawText);
    }

    public static List<ConvertedQuestionItem> parseByRegex(String text) {
        List<ConvertedQuestionItem> items = new ArrayList<>();
        Pattern questionPattern = Pattern.compile("(?iu)(?:Câu|Cau|Question)\\s+(\\d+)[\\.:\\s]+([\\s\\S]*?)(?=(?:Câu|Cau|Question)\\s+\\d+[\\.:\\s]+|$)");
        Matcher matcher = questionPattern.matcher(text);

        while (matcher.find()) {
            String questionNumber = matcher.group(1);
            String questionBody = matcher.group(2).trim();

            int correctNumber = 1;
            Matcher ansMatcher = Pattern.compile("(?iu)(?:đáp\\s*án|dap\\s*an|chọn|chon)[:\\s]+([A-D])").matcher(questionBody);
            if (ansMatcher.find()) {
                String ansChar = ansMatcher.group(1).toUpperCase();
                correctNumber = ansChar.charAt(0) - 'A' + 1;
            }

            // Xoá phần Đáp án nếu có ở cuối câu hỏi để không dính vào option D
            String cleanedBody = questionBody.replaceAll("(?iu)(?:đáp\\s*án|dap\\s*an|chọn|chon)[:\\s]+[A-D].*$", "").trim();

            String optA = extractOption(cleanedBody, "A");
            String optB = extractOption(cleanedBody, "B");
            String optC = extractOption(cleanedBody, "C");
            String optD = extractOption(cleanedBody, "D");

            int aIndex = indexOfOption(cleanedBody, "A");
            String prompt = aIndex > 0 ? cleanedBody.substring(0, aIndex).trim() : cleanedBody;
            if (!prompt.toLowerCase().startsWith("câu") && !prompt.toLowerCase().startsWith("cau")) {
                prompt = "Câu " + questionNumber + ": " + prompt;
            }

            items.add(new ConvertedQuestionItem(
                    prompt,
                    List.of(
                            optA.isEmpty() ? "A" : optA.startsWith("A.") ? optA : "A. " + optA,
                            optB.isEmpty() ? "B" : optB.startsWith("B.") ? optB : "B. " + optB,
                            optC.isEmpty() ? "C" : optC.startsWith("C.") ? optC : "C. " + optC,
                            optD.isEmpty() ? "D" : optD.startsWith("D.") ? optD : "D. " + optD
                    ),
                    correctNumber,
                    ""
            ));
        }

        return items;
    }

    private static int indexOfOption(String text, String letter) {
        Matcher m = Pattern.compile("(?m)(?:^|\\s+)" + letter + "[\\.\\)]\\s*").matcher(text);
        if (m.find()) return m.start();
        return -1;
    }

    private static String extractOption(String text, String letter) {
        String nextLetter = letter.equals("A") ? "B" : letter.equals("B") ? "C" : letter.equals("C") ? "D" : null;
        String regex;
        if (nextLetter != null) {
            regex = "(?s)(?:^|\\s+)" + letter + "[\\.\\)]\\s*(.*?)(?=(?:\\s+" + nextLetter + "[\\.\\)])|$)";
        } else {
            regex = "(?s)(?:^|\\s+)" + letter + "[\\.\\)]\\s*(.*)$";
        }
        Matcher m = Pattern.compile(regex).matcher(text);
        if (m.find()) {
            return m.group(1).trim().replaceAll("\\s+", " ");
        }
        return "";
    }
}
