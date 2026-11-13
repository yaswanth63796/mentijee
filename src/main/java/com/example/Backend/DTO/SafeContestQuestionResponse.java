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
public class SafeContestQuestionResponse {
    private Long id;
    private Integer questionOrder;
    private String subjectName;
    private String topic;
    private String questionText;
    private QuestionType questionType;
    private Difficulty difficulty;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Integer marks;
    private Integer negativeMarks;
}
