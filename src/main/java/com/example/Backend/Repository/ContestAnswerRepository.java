package com.example.Backend.Repository;

import com.example.Backend.Entity.ContestAnswer;
import com.example.Backend.Entity.ContestAttempt;
import com.example.Backend.Entity.ContestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestAnswerRepository extends JpaRepository<ContestAnswer, Long> {

    List<ContestAnswer> findByContestAttempt(ContestAttempt contestAttempt);

    Optional<ContestAnswer> findByContestAttemptAndQuestion(ContestAttempt contestAttempt, ContestQuestion question);

    Optional<ContestAnswer> findByContestAttemptAndQuestionId(ContestAttempt contestAttempt, Long questionId);
}
