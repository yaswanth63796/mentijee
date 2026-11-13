package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestLeaderboardResponse {
    private Long contestId;
    private String contestTitle;
    private String contestStatus;
    private Integer totalParticipants;
    private Double averageScore;
    private Integer highestScore;
    private List<LeaderboardEntryResponse> top10;
    private LeaderboardEntryResponse currentUserEntry;
}
