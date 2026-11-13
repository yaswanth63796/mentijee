package com.example.Backend.Repository;

import com.example.Backend.Entity.Contest;
import com.example.Backend.Entity.ContestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestAttemptRepository extends JpaRepository<ContestAttempt, Long> {

    Optional<ContestAttempt> findBySessionId(String sessionId);

    Optional<ContestAttempt> findByContestAndParticipantEmail(Contest contest, String participantEmail);

    List<ContestAttempt> findByContestOrderByStartedAtDesc(Contest contest);

    long countByContest(Contest contest);

    long countByContestAndIsSubmittedTrue(Contest contest);

    @Query("SELECT a FROM ContestAttempt a WHERE a.contest.id = :contestId AND a.isSubmitted = true " +
           "ORDER BY a.totalScore DESC, a.totalCorrect DESC, a.accuracyPercent DESC, a.completionTimeSecs ASC")
    List<ContestAttempt> findLeaderboardByContestId(@Param("contestId") Long contestId);

    @Query("SELECT a FROM ContestAttempt a WHERE a.contest.id = :contestId ORDER BY a.startedAt DESC")
    List<ContestAttempt> findAllAttemptsByContestId(@Param("contestId") Long contestId);
}
