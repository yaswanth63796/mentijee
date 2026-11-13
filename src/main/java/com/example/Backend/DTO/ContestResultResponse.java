package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestResultResponse {
    private Long attemptId;
    private Long contestId;
    private String contestTitle;
    private String participantName;
    private String participantEmail;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer completionTimeSecs;

    private Integer totalScore;
    private Integer maxMarks;
    private Integer totalCorrect;
    private Integer totalWrong;
    private Integer totalUnanswered;
    private Integer totalAttempted;
    private Double accuracyPercent;
    private Integer rank;

    private Integer physicsScore;
    private Integer chemistryScore;
    private Integer mathematicsScore;

    private Integer physicsCorrect;
    private Integer chemistryCorrect;
    private Integer mathematicsCorrect;

    private Integer physicsAttempted;
    private Integer chemistryAttempted;
    private Integer mathematicsAttempted;

    private List<FullContestQuestionResponse> questions;
}
