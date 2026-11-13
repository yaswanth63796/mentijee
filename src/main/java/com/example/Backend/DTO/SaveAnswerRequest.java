package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveAnswerRequest {
    private String sessionId;
    private String selectedOption; // "A", "B", "C", "D" or numeric string
    private Boolean isMarkedForReview;
}
