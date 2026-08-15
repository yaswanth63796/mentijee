package com.example.Backend.Repository;

import com.example.Backend.Entity.PracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {
}