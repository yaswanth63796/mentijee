package com.example.Backend.Controller;

import com.example.Backend.DTO.AnalyticsResponse;
import com.example.Backend.DTO.TestResultRequest;
import com.example.Backend.DTO.TestResultResponse;
import com.example.Backend.Service.TestResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test-results")
public class TestResultController {

    @Autowired
    private TestResultService service;

    /** Save a completed practice session result (idempotent via sessionId) */
    @PostMapping
    public ResponseEntity<TestResultResponse> save(@RequestBody TestResultRequest req) {
        if (req.getSessionId() == null || req.getSessionId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        TestResultResponse saved = service.saveResult(req);
        return ResponseEntity.ok(saved);
    }

    /** Retrieve all test results, newest first */
    @GetMapping
    public List<TestResultResponse> getAll() {
        return service.getAllResults();
    }

    /** Retrieve analytics and chart data */
    @GetMapping("/analytics")
    public AnalyticsResponse getAnalytics() {
        return service.getAnalytics();
    }

    /** Retrieve a single detailed test result */
    @GetMapping("/{id}")
    public ResponseEntity<TestResultResponse> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getResultById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
