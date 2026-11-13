package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestJoinResponse {
    private String sessionId;
    private Long attemptId;
    private Long contestId;
    private String contestTitle;
    private String participantName;
    private String participantEmail;
    private LocalDateTime startedAt;
    private LocalDateTime deadline;
    private Long remainingSeconds;
    private Boolean isSubmitted;
    private Map<Long, String> savedAnswers; // questionId -> selectedOption
    private Map<Long, Boolean> markedForReview; // questionId -> isMarkedForReview
}
