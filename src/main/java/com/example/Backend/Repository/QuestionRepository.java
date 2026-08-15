package com.example.Backend.Repository;

import com.example.Backend.Entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findBySubjectSubjectIdOrderByIdAsc(Long subjectId);
}