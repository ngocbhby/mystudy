package vn.mystudy.study;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Danh mục môn thi và mục đích ôn tập; nguồn sự thật duy nhất ở phía backend. */
public final class StudyCatalog {

    public static final Map<String, String> SUBJECTS = subjects();
    public static final List<String> REQUIRED = List.of("math", "literature");
    public static final List<String> ELECTIVES = SUBJECTS.keySet().stream().filter(c -> !REQUIRED.contains(c)).toList();
    public static final List<String> PURPOSES = List.of("graduation", "university_admission");
    public static final List<String> STRATEGIES = List.of("exam_focused", "foundation_first");
    public static final String DEFAULT_STRATEGY = "exam_focused";

    private StudyCatalog() {}

    private static Map<String, String> subjects() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("math", "Toán");
        map.put("literature", "Ngữ văn");
        map.put("physics", "Vật lí");
        map.put("chemistry", "Hóa học");
        map.put("biology", "Sinh học");
        map.put("history", "Lịch sử");
        map.put("geography", "Địa lí");
        map.put("civics", "Giáo dục kinh tế và pháp luật");
        map.put("informatics", "Tin học");
        map.put("technology", "Công nghệ");
        map.put("english", "Tiếng Anh");
        // Map.copyOf làm mất thứ tự; giữ thứ tự khai báo để danh sách môn tự chọn ổn định.
        return java.util.Collections.unmodifiableMap(map);
    }
}
