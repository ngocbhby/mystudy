package vn.mystudy.samples.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import vn.mystudy.samples.entity.WorkedExample;

public interface WorkedExampleRepository extends JpaRepository<WorkedExample, UUID>, JpaSpecificationExecutor<WorkedExample> {

    /** Nạp luôn chuyên đề để tránh truy vấn N+1 khi dựng danh sách. */
    @Override
    @EntityGraph(attributePaths = "topic")
    List<WorkedExample> findAll(Specification<WorkedExample> spec, Sort sort);

    @Override
    @EntityGraph(attributePaths = "topic")
    List<WorkedExample> findAll();
}
