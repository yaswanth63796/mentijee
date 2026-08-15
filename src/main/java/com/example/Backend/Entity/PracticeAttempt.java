package com.example.Backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "practice_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private Integer attemptNumber;

    @Column(nullable = false)
    private String submittedAnswer;

    @Column(nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private Integer marksObtained;

    @Column(nullable = false)
    private LocalDateTime attemptedAt;
}