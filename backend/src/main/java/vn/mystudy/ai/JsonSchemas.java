package vn.mystudy.ai;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.RecordComponent;
import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sinh JSON Schema từ record Java (chuỗi, số, boolean, List, record lồng nhau) kèm mô tả từ
 * {@link JsonPropertyDescription}. Dùng cho nhà cung cấp AI cần schema dạng JSON (ví dụ Gemini), để mọi nhà cung
 * cấp dùng chung một định nghĩa đầu ra.
 */
final class JsonSchemas {

    private JsonSchemas() {
    }

    static Map<String, Object> of(Class<?> type) {
        if (!type.isRecord()) throw new IllegalArgumentException(type + " must be a record");
        Map<String, Object> properties = new LinkedHashMap<>();
        List<String> required = new ArrayList<>();
        for (RecordComponent component : type.getRecordComponents()) {
            Map<String, Object> schema = new LinkedHashMap<>(forType(component.getGenericType()));
            JsonPropertyDescription description = description(type, component);
            if (description != null) schema.put("description", description.value());
            properties.put(component.getName(), schema);
            required.add(component.getName());
        }
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", required);
        schema.put("additionalProperties", false);
        return schema;
    }

    /** Chú thích trên thành phần record được Java chép sang field hoặc phương thức truy cập tùy @Target của nó. */
    private static JsonPropertyDescription description(Class<?> type, RecordComponent component) {
        JsonPropertyDescription found = component.getAnnotation(JsonPropertyDescription.class);
        if (found == null) found = component.getAccessor().getAnnotation(JsonPropertyDescription.class);
        if (found == null) {
            try {
                found = type.getDeclaredField(component.getName()).getAnnotation(JsonPropertyDescription.class);
            } catch (NoSuchFieldException e) {
                found = null;
            }
        }
        return found;
    }

    private static Map<String, Object> forType(Type type) {
        if (type instanceof ParameterizedType parameterized
                && parameterized.getRawType() instanceof Class<?> raw && List.class.isAssignableFrom(raw)) {
            return Map.of("type", "array", "items", forType(parameterized.getActualTypeArguments()[0]));
        }
        if (type instanceof Class<?> c) {
            if (c == String.class) return Map.of("type", "string");
            if (c == int.class || c == Integer.class || c == long.class || c == Long.class) {
                return Map.of("type", "integer");
            }
            if (c == double.class || c == Double.class || c == float.class || c == Float.class
                    || c == BigDecimal.class) {
                return Map.of("type", "number");
            }
            if (c == boolean.class || c == Boolean.class) return Map.of("type", "boolean");
            if (c.isRecord()) return of(c);
        }
        throw new IllegalArgumentException("Unsupported schema type: " + type);
    }
}
