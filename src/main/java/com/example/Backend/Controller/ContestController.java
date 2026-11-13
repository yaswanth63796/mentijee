package com.example.Backend.Controller;

import com.example.Backend.DTO.*;
import com.example.Backend.Service.ContestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contests")
public class ContestController {

    @Autowired
    private ContestService contestService;

    /** List all published contests (upcoming, active, completed) */
    @GetMapping
    public ResponseEntity<List<ContestResponse>> getPublishedContests() {
        return ResponseEntity.ok(contestService.getPublishedContests());
    }

    /** Get details of a single contest */
    @GetMapping("/{contestId}")
    public ResponseEntity<ContestResponse> getContestDetails(@PathVariable Long contestId) {
        return ResponseEntity.ok(contestService.getContestDetails(contestId));
    }

    /** Register / start an attempt */
    @PostMapping("/{contestId}/join")
    public ResponseEntity<ContestJoinResponse> joinContest(
            @PathVariable Long contestId,
            @RequestBody ContestJoinRequest req) {
        return ResponseEntity.ok(contestService.joinContest(contestId, req));
    }

    /** Resume existing attempt with saved answers and time remaining */
    @GetMapping("/{contestId}/attempt")
    public ResponseEntity<ContestJoinResponse> resumeAttempt(
            @PathVariable Long contestId,
            @RequestParam String sessionId) {
        return ResponseEntity.ok(contestService.resumeAttempt(contestId, sessionId));
    }

    /** Retrieve safe questions for active contest attempt (NO answers, NO explanations) */
    @GetMapping("/{contestId}/questions")
    public ResponseEntity<List<SafeContestQuestionResponse>> getSafeQuestions(
            @PathVariable Long contestId,
            @RequestParam String sessionId) {
        return ResponseEntity.ok(contestService.getSafeContestQuestions(contestId, sessionId));
    }

    /** Save an answer / marked for review status */
    @PutMapping("/{contestId}/answers/{questionId}")
    public ResponseEntity<Void> saveAnswer(
            @PathVariable Long contestId,
            @PathVariable Long questionId,
            @RequestBody SaveAnswerRequest req) {
        contestService.saveAnswer(contestId, questionId, req);
        return ResponseEntity.ok().build();
    }

    /** Submit contest, evaluate attempt, calculate ranks, trigger WebSocket broadcast */
    @PostMapping("/{contestId}/submit")
    public ResponseEntity<ContestResultResponse> submitContest(
            @PathVariable Long contestId,
            @RequestBody SubmitContestRequest req) {
        return ResponseEntity.ok(contestService.submitContest(contestId, req));
    }

    /** Retrieve individual result after submission */
    @GetMapping("/{contestId}/result")
    public ResponseEntity<ContestResultResponse> getResult(
            @PathVariable Long contestId,
            @RequestParam String sessionId) {
        return ResponseEntity.ok(contestService.getParticipantResult(contestId, sessionId));
    }

    /** Retrieve live leaderboard with Top 10 and current participant rank */
    @GetMapping("/{contestId}/leaderboard")
    public ResponseEntity<ContestLeaderboardResponse> getLeaderboard(
            @PathVariable Long contestId,
            @RequestParam(required = false) String sessionId) {
        return ResponseEntity.ok(contestService.getContestLeaderboard(contestId, sessionId));
    }
}
