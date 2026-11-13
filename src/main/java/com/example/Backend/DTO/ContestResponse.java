package com.example.Backend.DTO;

import com.example.Backend.Entity.ContestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestResponse {
    private Long id;
    private String title;
    private String description;
    private String instructions;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private ContestStatus status;
    private String dynamicState; // UPCOMING, ACTIVE, COMPLETED, DRAFT, CANCELLED
    private String physicsTopics;
    private String chemistryTopics;
    private String mathematicsTopics;
    private Integer totalQuestions;
    private Integer maxMarks;
    private Integer correctMarks;
    private Integer negativeMarks;
    private Long participantCount;
    private Long submissionCount;
    private Long questionsCount;
    private LocalDateTime createdAt;
}
