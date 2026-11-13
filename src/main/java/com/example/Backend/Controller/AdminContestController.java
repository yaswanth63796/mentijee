package com.example.Backend.Controller;

import com.example.Backend.DTO.*;
import com.example.Backend.Entity.ContestAttempt;
import com.example.Backend.Service.ContestService;
import com.example.Backend.Service.QuestionFileParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/contests")
public class AdminContestController {

    @Autowired
    private ContestService contestService;

    @Autowired
    private QuestionFileParserService questionFileParserService;

    @PostMapping
    public ResponseEntity<ContestResponse> createContest(@RequestBody ContestRequest req) {
        return ResponseEntity.ok(contestService.createContest(req));
    }

    @PutMapping("/{contestId}")
    public ResponseEntity<ContestResponse> updateContest(
            @PathVariable Long contestId,
            @RequestBody ContestRequest req) {
        return ResponseEntity.ok(contestService.updateContest(contestId, req));
    }

    @PostMapping(value = "/{contestId}/preview-questions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileValidationResponse> previewQuestions(
            @PathVariable Long contestId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(contestService.previewQuestions(contestId, file));
    }

    @PostMapping(value = "/{contestId}/upload-questions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileValidationResponse> uploadQuestions(
            @PathVariable Long contestId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(contestService.uploadQuestions(contestId, file));
    }

    @PostMapping("/{contestId}/publish")
    public ResponseEntity<ContestResponse> publishContest(@PathVariable Long contestId) {
        return ResponseEntity.ok(contestService.publishContest(contestId));
    }

    @PostMapping("/{contestId}/cancel")
    public ResponseEntity<ContestResponse> cancelContest(@PathVariable Long contestId) {
        return ResponseEntity.ok(contestService.cancelContest(contestId));
    }

    @GetMapping
    public ResponseEntity<List<ContestResponse>> getAllContests() {
        return ResponseEntity.ok(contestService.getAllContestsForAdmin());
    }

    @GetMapping("/{contestId}")
    public ResponseEntity<ContestResponse> getContestDetails(@PathVariable Long contestId) {
        return ResponseEntity.ok(contestService.getContestDetails(contestId));
    }

    @GetMapping("/{contestId}/questions")
    public ResponseEntity<List<FullContestQuestionResponse>> getContestQuestions(@PathVariable Long contestId) {
        return ResponseEntity.ok(contestService.getContestQuestionsForAdmin(contestId));
    }

    @GetMapping("/topics")
    public ResponseEntity<java.util.Map<String, List<String>>> getSubjectTopics() {
        return ResponseEntity.ok(contestService.getSubjectTopics());
    }

    @PostMapping("/{contestId}/questions")
    public ResponseEntity<FullContestQuestionResponse> addQuestion(
            @PathVariable Long contestId,
            @RequestBody ContestQuestionRequest req) {
        return ResponseEntity.ok(contestService.addQuestion(contestId, req));
    }

    @PutMapping("/{contestId}/questions/{questionId}")
    public ResponseEntity<FullContestQuestionResponse> updateQuestion(
            @PathVariable Long contestId,
            @PathVariable Long questionId,
            @RequestBody ContestQuestionRequest req) {
        return ResponseEntity.ok(contestService.updateQuestion(contestId, questionId, req));
    }

    @DeleteMapping("/{contestId}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long contestId,
            @PathVariable Long questionId) {
        contestService.deleteQuestion(contestId, questionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{contestId}/save-all-questions")
    public ResponseEntity<List<FullContestQuestionResponse>> saveAllQuestions(
            @PathVariable Long contestId,
            @RequestBody List<ContestQuestionRequest> requests) {
        return ResponseEntity.ok(contestService.saveAllQuestions(contestId, requests));
    }

    @GetMapping("/{contestId}/attempts")
    public ResponseEntity<List<ContestAttempt>> getContestAttempts(@PathVariable Long contestId) {
        return ResponseEntity.ok(contestService.getContestAttemptsForAdmin(contestId));
    }

    @GetMapping("/template/{format}")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable String format) {
        try {
            if ("json".equalsIgnoreCase(format)) {
                String json = questionFileParserService.generateSampleJson();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mentijee_15_questions_template.json\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(json.getBytes(StandardCharsets.UTF_8));
            } else {
                String csv = questionFileParserService.generateSampleCsv();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mentijee_15_questions_template.csv\"")
                        .contentType(MediaType.parseMediaType("text/csv"))
                        .body(csv.getBytes(StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
