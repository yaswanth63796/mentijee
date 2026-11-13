package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryResponse {
    private Integer rank;
    private String participantName;
    private Integer totalScore;
    private Integer totalCorrect;
    private Double accuracyPercent;
    private Integer completionTimeSecs;
    private LocalDateTime submittedAt;
    private Boolean isCurrentParticipant;
}
