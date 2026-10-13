package com.example.Backend.DTO;

import lombok.Data;

@Data
public class SubjectResultRequest {
    private String subjectName;
    private Integer marksObtained;
    private Integer maxMarks;
    private Integer correct;
    private Integer wrong;
    private Integer attempted;
    private Integer timeSecs;
}
