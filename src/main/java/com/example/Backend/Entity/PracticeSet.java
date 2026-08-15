package com.example.Backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "practice_sets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;



    @ManyToMany
    @JoinTable(
            name = "practice_set_questions",
            joinColumns = @JoinColumn(name = "practice_set_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private List<Question> questions;
}