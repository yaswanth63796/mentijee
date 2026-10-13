package com.example.Backend.Repository;

import com.example.Backend.Entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    /** Used to detect duplicate submissions from the same session */
    Optional<TestResult> findBySessionId(String sessionId);

    /** History list — newest first */
    List<TestResult> findAllByOrderByCompletedAtDesc();

    /** For analytics — most recent 50 attempts */
    @Query("SELECT t FROM TestResult t ORDER BY t.completedAt DESC")
    List<TestResult> findTopOrderByCompletedAtDesc(org.springframework.data.domain.Pageable pageable);
}
