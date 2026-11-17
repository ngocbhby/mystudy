package vn.mystudy.config;

import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Phục vụ bản build React từ {@code classpath:/static/} với chính sách cache phù hợp. */
@Configuration
class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
        registry.addResourceHandler("/tai-lieu/**")
                .addResourceLocations("classpath:/static/tai-lieu/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic());
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic());
        registry.addResourceHandler("/index.html", "/favicon.svg", "/robots.txt")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache());
    }
}
