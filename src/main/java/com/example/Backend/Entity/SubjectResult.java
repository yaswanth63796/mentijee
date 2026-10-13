package com.example.Backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subject_results", indexes = {
    @Index(name = "idx_subject_results_test", columnList = "test_result_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_result_id", nullable = false)
    @JsonIgnore
    private TestResult testResult;

    @Column(nullable = false)
    private String subjectName;

    @Column(nullable = false)
    private Integer marksObtained;

    @Column(nullable = false)
    private Integer maxMarks;

    @Column(nullable = false)
    private Integer correct;

    @Column(nullable = false)
    private Integer wrong;

    @Column(nullable = false)
    private Integer attempted;

    /** Time spent on this subject in seconds */
    @Column(nullable = false)
    private Integer timeSecs;

    @Column(nullable = false)
    private Double accuracyPercent;
}
