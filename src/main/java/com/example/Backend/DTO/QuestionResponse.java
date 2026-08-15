package com.example.Backend.DTO;

import com.example.Backend.Entity.Option;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class QuestionResponse {

    private Long id;
    private String questionText;
    private String questionType;
    private String difficulty;
    private Integer marks;
    private List<Option> options;
}