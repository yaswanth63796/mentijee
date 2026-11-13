package com.example.Backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contest_answers", indexes = {
    @Index(name = "idx_contest_answers_attempt", columnList = "attempt_id"),
    @Index(name = "idx_contest_answers_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContestAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonIgnore
    private ContestAttempt contestAttempt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    private ContestQuestion question;

    @Column(name = "selected_option")
    private String selectedOption; // "A", "B", "C", "D" or numeric string

    @Column(name = "is_marked_for_review", nullable = false)
    @Builder.Default
    private Boolean isMarkedForReview = false;

    @Column(name = "is_correct", nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(name = "marks_awarded", nullable = false)
    @Builder.Default
    private Integer marksAwarded = 0;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.answeredAt = LocalDateTime.now();
        if (this.isMarkedForReview == null) {
            this.isMarkedForReview = false;
        }
        if (this.isCorrect == null) {
            this.isCorrect = false;
        }
        if (this.marksAwarded == null) {
            this.marksAwarded = 0;
        }
    }
}
