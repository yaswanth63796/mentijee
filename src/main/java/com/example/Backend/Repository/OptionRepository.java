package com.example.Backend.Repository;

import com.example.Backend.Entity.Option;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OptionRepository extends JpaRepository<Option, Long> {
}