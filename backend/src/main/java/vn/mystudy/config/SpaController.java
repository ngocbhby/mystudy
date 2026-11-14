package vn.mystudy.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Các đường dẫn do React Router xử lý đều trả về {@code index.html}. */
@Controller
class SpaController {

    @GetMapping({
        "/", "/dang-nhap", "/thiet-lap-muc-tieu", "/lo-trinh", "/tong-quan", "/kho-de-thi", "/kho-bai-mau", "/thi-thu",
        "/thi-thu/{id:[0-9a-fA-F-]{36}}",
        "/thi-thu/{id:[0-9a-fA-F-]{36}}/{view:de|dap-an}"
    })
    String index() {
        return "forward:/index.html";
    }
}
