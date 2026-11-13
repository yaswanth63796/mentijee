package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileValidationResponse {
    private boolean valid;
    private String message;
    private Integer totalQuestionsFound;
    private Map<String, Integer> subjectCounts; // Physics -> 5, Chemistry -> 5, Mathematics -> 5
    private List<ValidationErrorDTO> errors;
    private List<QuestionImportDTO> previewQuestions;
}
