package com.example.Backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contest_questions", indexes = {
    @Index(name = "idx_contest_q_contest", columnList = "contest_id"),
    @Index(name = "idx_contest_q_subject", columnList = "subject_name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    @JsonIgnore
    private Contest contest;

    @Column(name = "subject_name", nullable = false)
    private String subjectName; // "Physics", "Chemistry", "Mathematics"

    @Column
    private String topic;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder; // 1 to 15

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType; // MCQ or NUMERICAL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty; // EASY, MEDIUM, HARD

    @Column(name = "option_a", columnDefinition = "TEXT")
    private String optionA;

    @Column(name = "option_b", columnDefinition = "TEXT")
    private String optionB;

    @Column(name = "option_c", columnDefinition = "TEXT")
    private String optionC;

    @Column(name = "option_d", columnDefinition = "TEXT")
    private String optionD;

    @Column(name = "correct_answer", nullable = false)
    private String correctAnswer;

    @Column(name = "numerical_tolerance")
    @Builder.Default
    private Double numericalTolerance = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Integer marks = 4;

    @Column(name = "negative_marks", nullable = false)
    @Builder.Default
    private Integer negativeMarks = 1;

    @Column(columnDefinition = "TEXT")
    private String explanation;
}
