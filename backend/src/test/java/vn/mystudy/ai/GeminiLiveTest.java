package vn.mystudy.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import tools.jackson.databind.json.JsonMapper;

/**
 * Gọi Gemini THẬT (tốn hạn mức). Mặc định bị bỏ qua; chỉ chạy khi đặt biến môi trường GEMINI_LIVE_KEY:
 * {@code GEMINI_LIVE_KEY=... ./mvnw test -Dtest=GeminiLiveTest}. Mô hình lấy từ GEMINI_LIVE_MODEL (mặc định
 * gemini-3.5-flash-lite).
 */
@EnabledIfEnvironmentVariable(named = "GEMINI_LIVE_KEY", matches = ".+")
class GeminiLiveTest {

    private final String model = System.getenv().getOrDefault("GEMINI_LIVE_MODEL", "gemini-3.5-flash-lite");
    private final GeminiAiGateway gemini = new GeminiAiGateway(JsonMapper.builder().build(),
            "https://generativelanguage.googleapis.com/v1beta", System.getenv("GEMINI_LIVE_KEY"), model);

    private static long timed(Runnable call) {
        long start = System.nanoTime();
        call.run();
        return (System.nanoTime() - start) / 1_000_000;
    }

    @Test
    void explainsAWrongAnswer() {
        WrongAnswerExplanation[] result = new WrongAnswerExplanation[1];
        long ms = timed(() -> result[0] = gemini.generate(ExplanationService.SYSTEM_PROMPT, """
                <mon_hoc>math</mon_hoc><chuyen_de>Đạo hàm</chuyen_de>
                <cau_hoi>Đạo hàm của y = x³ là gì?</cau_hoi>
                <cac_lua_chon>A. 3x²
                B. x²
                C. 3x
                D. x⁴/4
                </cac_lua_chon><dap_an_dung>A</dap_an_dung><hoc_sinh_chon>B</hoc_sinh_chon>
                <loi_giai_tham_khao>(xⁿ)′ = n·xⁿ⁻¹</loi_giai_tham_khao>""", WrongAnswerExplanation.class, 4000));
        System.out.printf("[live %s] explanation %d ms: %s%n", model, ms, result[0]);
        assertThat(result[0].steps()).isNotEmpty();
        assertThat(String.join(" ", result[0].steps())).contains("3");
    }

    @Test
    void writesATopicNote() {
        TopicNoteDraft[] result = new TopicNoteDraft[1];
        long ms = timed(() -> result[0] = gemini.generate(TopicNoteService.SYSTEM_PROMPT,
                "<mon_hoc>Vật lí</mon_hoc>\n<chuyen_de>Khí lí tưởng</chuyen_de>", TopicNoteDraft.class, 4000));
        System.out.printf("[live %s] topic note %d ms, %d chars%n", model, ms, result[0].markdown().length());
        assertThat(result[0].markdown()).contains("##");
    }

    @Test
    void writesAWeaknessReport() {
        WeaknessReport[] result = new WeaknessReport[1];
        long ms = timed(() -> result[0] = gemini.generate(WeaknessService.SYSTEM_PROMPT, """
                <ti_le_dung_theo_chuyen_de>
                - Toán | Đạo hàm và khảo sát hàm số | đúng 1/10 (10%)
                - Toán | Nguyên hàm và tích phân | đúng 7/8 (88%)
                </ti_le_dung_theo_chuyen_de>
                <cau_sai_gan_day>
                - [Đạo hàm và khảo sát hàm số] Đạo hàm của y = x³ là gì?
                </cau_sai_gan_day>""", WeaknessReport.class, 6000));
        System.out.printf("[live %s] weakness report %d ms: %s%n", model, ms, result[0].summary());
        assertThat(result[0].priorities()).isNotEmpty();
        assertThat(result[0].priorities().get(0).topicName()).contains("Đạo hàm");
        assertThat(List.of(result[0].priorities().get(0).nextTasks())).isNotEmpty();
    }
}
