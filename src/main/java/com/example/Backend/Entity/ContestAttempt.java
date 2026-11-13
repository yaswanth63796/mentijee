package com.example.Backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contest_attempts", indexes = {
    @Index(name = "idx_contest_attempts_contest", columnList = "contest_id"),
    @Index(name = "idx_contest_attempts_session", columnList = "session_id", unique = true),
    @Index(name = "idx_contest_attempts_score", columnList = "contest_id, total_score, total_correct, accuracy_percent, completion_time_secs")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    @JsonIgnoreProperties({"questions", "description", "instructions"})
    private Contest contest;

    @Column(name = "participant_name", nullable = false)
    private String participantName;

    @Column(name = "participant_email", nullable = false)
    private String participantEmail;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "session_id", nullable = false, unique = true, length = 64)
    private String sessionId;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Column(name = "is_submitted", nullable = false)
    @Builder.Default
    private Boolean isSubmitted = false;

    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    @Column(name = "max_marks", nullable = false)
    @Builder.Default
    private Integer maxMarks = 60;

    @Column(name = "total_correct", nullable = false)
    @Builder.Default
    private Integer totalCorrect = 0;

    @Column(name = "total_wrong", nullable = false)
    @Builder.Default
    private Integer totalWrong = 0;

    @Column(name = "total_unanswered", nullable = false)
    @Builder.Default
    private Integer totalUnanswered = 15;

    @Column(name = "total_attempted", nullable = false)
    @Builder.Default
    private Integer totalAttempted = 0;

    @Column(name = "accuracy_percent", nullable = false)
    @Builder.Default
    private Double accuracyPercent = 0.0;

    @Column(name = "completion_time_secs", nullable = false)
    @Builder.Default
    private Integer completionTimeSecs = 0;

    @Column(name = "physics_score", nullable = false)
    @Builder.Default
    private Integer physicsScore = 0;

    @Column(name = "chemistry_score", nullable = false)
    @Builder.Default
    private Integer chemistryScore = 0;

    @Column(name = "mathematics_score", nullable = false)
    @Builder.Default
    private Integer mathematicsScore = 0;

    @Column(name = "physics_correct", nullable = false)
    @Builder.Default
    private Integer physicsCorrect = 0;

    @Column(name = "chemistry_correct", nullable = false)
    @Builder.Default
    private Integer chemistryCorrect = 0;

    @Column(name = "mathematics_correct", nullable = false)
    @Builder.Default
    private Integer mathematicsCorrect = 0;

    @Column(name = "physics_attempted", nullable = false)
    @Builder.Default
    private Integer physicsAttempted = 0;

    @Column(name = "chemistry_attempted", nullable = false)
    @Builder.Default
    private Integer chemistryAttempted = 0;

    @Column(name = "mathematics_attempted", nullable = false)
    @Builder.Default
    private Integer mathematicsAttempted = 0;

    @Column(name = "leaderboard_rank")
    @Builder.Default
    private Integer rank = 0;

    @OneToMany(mappedBy = "contestAttempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("contestAttempt")
    @Builder.Default
    private List<ContestAnswer> answers = new ArrayList<>();
}
