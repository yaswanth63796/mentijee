package com.example.Backend.Repository;

import com.example.Backend.Entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @Query("SELECT q FROM Question q WHERE q.subject.subject_id = :subjectId ORDER BY q.id ASC")
    List<Question> findQuestionsBySubjectId(@Param("subjectId") Long subjectId);
}