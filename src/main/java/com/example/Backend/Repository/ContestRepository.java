package com.example.Backend.Repository;

import com.example.Backend.Entity.Contest;
import com.example.Backend.Entity.ContestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {

    List<Contest> findByStatus(ContestStatus status);

    List<Contest> findAllByOrderByStartTimeDesc();

    @Query("SELECT c FROM Contest c WHERE c.status = 'PUBLISHED' ORDER BY c.startTime ASC")
    List<Contest> findPublishedContests();
}
