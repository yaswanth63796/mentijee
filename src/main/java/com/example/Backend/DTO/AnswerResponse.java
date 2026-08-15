package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AnswerResponse {

    private boolean correct;
    private Integer score;
    private String correctAnswer;
    private String explanation;
    private Long nextQuestion;
}
