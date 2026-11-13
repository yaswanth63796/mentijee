package com.example.Backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contests", indexes = {
    @Index(name = "idx_contests_status", columnList = "status"),
    @Index(name = "idx_contests_times", columnList = "start_time, end_time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContestStatus status = ContestStatus.DRAFT;

    @Column(name = "physics_topics", columnDefinition = "TEXT")
    private String physicsTopics;

    @Column(name = "chemistry_topics", columnDefinition = "TEXT")
    private String chemistryTopics;

    @Column(name = "mathematics_topics", columnDefinition = "TEXT")
    private String mathematicsTopics;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalQuestions = 15;

    @Column(nullable = false)
    @Builder.Default
    private Integer maxMarks = 60;

    @Column(nullable = false)
    @Builder.Default
    private Integer correctMarks = 4;

    @Column(nullable = false)
    @Builder.Default
    private Integer negativeMarks = 1;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    @JsonIgnoreProperties("contest")
    @Builder.Default
    private List<ContestQuestion> questions = new ArrayList<>();

    @PrePersist
    public void onPrePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ContestStatus.DRAFT;
        }
        if (this.totalQuestions == null) {
            this.totalQuestions = 15;
        }
        if (this.maxMarks == null) {
            this.maxMarks = 60;
        }
        if (this.correctMarks == null) {
            this.correctMarks = 4;
        }
        if (this.negativeMarks == null) {
            this.negativeMarks = 1;
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Transient
    public String getDynamicState() {
        if (status == ContestStatus.CANCELLED) {
            return "CANCELLED";
        }
        if (status == ContestStatus.DRAFT) {
            return "DRAFT";
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startTime)) {
            return "UPCOMING";
        } else if (now.isAfter(endTime)) {
            return "COMPLETED";
        } else {
            return "ACTIVE";
        }
    }
}
