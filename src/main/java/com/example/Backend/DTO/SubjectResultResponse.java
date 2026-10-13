package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubjectResultResponse {
    private Long id;
    private String subjectName;
    private Integer marksObtained;
    private Integer maxMarks;
    private Integer correct;
    private Integer wrong;
    private Integer attempted;
    private Integer timeSecs;
    private Double accuracyPercent;
}
