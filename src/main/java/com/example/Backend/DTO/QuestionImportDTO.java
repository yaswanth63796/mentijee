package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionImportDTO {
    private Integer rowNumber;
    private String subject; // "Physics", "Chemistry", "Mathematics"
    private String topic;
    private String questionText;
    private String questionType; // "MCQ" or "NUMERICAL"
    private String difficulty; // "EASY", "MEDIUM", "HARD"
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;
    private Double numericalTolerance;
    private Integer marks;
    private Integer negativeMarks;
    private String explanation;
}
