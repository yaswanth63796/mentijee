package com.example.Backend.DTO;

import com.example.Backend.Entity.Difficulty;
import com.example.Backend.Entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestQuestionRequest {
    private Long id;
    private Integer questionOrder;
    private String subjectName; // "Physics", "Chemistry", "Mathematics"
    private String topic;
    private String questionText;
    private QuestionType questionType; // MCQ or NUMERICAL
    private Difficulty difficulty; // EASY, MEDIUM, HARD
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
