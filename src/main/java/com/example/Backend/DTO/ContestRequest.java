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
public class ContestRequest {
    private String title;
    private String description;
    private String instructions;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String physicsTopics;
    private String chemistryTopics;
    private String mathematicsTopics;
    private Integer correctMarks;
    private Integer negativeMarks;
}
