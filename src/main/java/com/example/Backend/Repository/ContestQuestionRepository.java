package com.example.Backend.Repository;

import com.example.Backend.Entity.Contest;
import com.example.Backend.Entity.ContestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestQuestionRepository extends JpaRepository<ContestQuestion, Long> {

    List<ContestQuestion> findByContestOrderByQuestionOrderAsc(Contest contest);

    List<ContestQuestion> findByContestIdOrderByQuestionOrderAsc(Long contestId);

    long countByContest(Contest contest);

    long countByContestAndSubjectNameIgnoreCase(Contest contest, String subjectName);

    void deleteByContest(Contest contest);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT q.topic FROM ContestQuestion q WHERE LOWER(q.subjectName) = LOWER(:subjectName) AND q.topic IS NOT NULL AND q.topic != ''")
    List<String> findDistinctTopicsBySubjectName(@org.springframework.data.repository.query.Param("subjectName") String subjectName);
}
