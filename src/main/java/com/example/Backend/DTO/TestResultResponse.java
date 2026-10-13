package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TestResultResponse {
    private Long id;
    private String sessionId;
    private String testName;
    private LocalDateTime completedAt;
    private Integer overallTimeSecs;
    private Integer totalScore;
    private Integer totalMaxMarks;
    private Integer totalCorrect;
    private Integer totalWrong;
    private Integer totalAttempted;
    private Double accuracyPercent;
    private List<SubjectResultResponse> subjectResults;
}
