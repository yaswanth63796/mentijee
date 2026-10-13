package com.example.Backend.Service;

import com.example.Backend.DTO.*;
import com.example.Backend.Entity.SubjectResult;
import com.example.Backend.Entity.TestResult;
import com.example.Backend.Repository.TestResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TestResultService {

    @Autowired
    private TestResultRepository repo;

    // ─────────────────────────────────────────────────────────────────────────
    // SAVE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public TestResultResponse saveResult(TestResultRequest req) {

        // Idempotent: return existing if already saved with this sessionId
        Optional<TestResult> existing = repo.findBySessionId(req.getSessionId());
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        // Validate and derive totals server-side
        List<SubjectResultRequest> subs = req.getSubjectResults() != null
                ? req.getSubjectResults()
                : new ArrayList<>();

        int totalScore = subs.stream().mapToInt(s -> safe(s.getMarksObtained())).sum();
        int totalMax = subs.stream().mapToInt(s -> safe(s.getMaxMarks())).sum();
        int totalCorrect = subs.stream().mapToInt(s -> safe(s.getCorrect())).sum();
        int totalWrong = subs.stream().mapToInt(s -> safe(s.getWrong())).sum();
        int totalAttempted = totalCorrect + totalWrong;
        double accuracy = totalAttempted > 0
                ? Math.round((totalCorrect * 100.0 / totalAttempted) * 100.0) / 100.0
                : 0.0;

        TestResult result = new TestResult();
        result.setSessionId(req.getSessionId());
        result.setTestName(req.getTestName() != null ? req.getTestName() : "JEE PRACTICE SET A");
        result.setCompletedAt(LocalDateTime.now());
        result.setOverallTimeSecs(safe(req.getOverallTimeSecs()));
        result.setTotalScore(totalScore);
        result.setTotalMaxMarks(totalMax > 0 ? totalMax : 300);
        result.setTotalCorrect(totalCorrect);
        result.setTotalWrong(totalWrong);
        result.setTotalAttempted(totalAttempted);
        result.setAccuracyPercent(accuracy);

        List<SubjectResult> subjectEntities = subs.stream().map(s -> {
            int att = safe(s.getCorrect()) + safe(s.getWrong());
            double acc = att > 0
                    ? Math.round((safe(s.getCorrect()) * 100.0 / att) * 100.0) / 100.0
                    : 0.0;
            SubjectResult sr = new SubjectResult();
            sr.setTestResult(result);
            sr.setSubjectName(s.getSubjectName() != null ? s.getSubjectName() : "Unknown");
            sr.setMarksObtained(safe(s.getMarksObtained()));
            sr.setMaxMarks(safe(s.getMaxMarks()) > 0 ? safe(s.getMaxMarks()) : 100);
            sr.setCorrect(safe(s.getCorrect()));
            sr.setWrong(safe(s.getWrong()));
            sr.setAttempted(att);
            sr.setTimeSecs(safe(s.getTimeSecs()));
            sr.setAccuracyPercent(acc);
            return sr;
        }).collect(Collectors.toList());

        result.setSubjectResults(subjectEntities);

        TestResult saved = repo.save(result);
        return toResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL
    // ─────────────────────────────────────────────────────────────────────────

    public List<TestResultResponse> getAllResults() {
        return repo.findAllByOrderByCompletedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ONE
    // ─────────────────────────────────────────────────────────────────────────

    public TestResultResponse getResultById(Long id) {
        TestResult tr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Test result not found: " + id));
        return toResponse(tr);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANALYTICS
    // ─────────────────────────────────────────────────────────────────────────

    public AnalyticsResponse getAnalytics() {
        List<TestResult> all = repo.findTopOrderByCompletedAtDesc(PageRequest.of(0, 50));
        // Reverse so charts go chronological (oldest → newest)
        List<TestResult> chronological = new ArrayList<>(all);
        chronological.sort(Comparator.comparing(TestResult::getCompletedAt));

        AnalyticsResponse resp = new AnalyticsResponse();

        if (all.isEmpty()) {
            resp.setTotalTests(0);
            resp.setLatestScore(0);
            resp.setBestScore(0);
            resp.setAverageScore(0.0);
            resp.setLatestAccuracy(0.0);
            resp.setAverageAccuracy(0.0);
            resp.setAverageTimeSecs(0);
            resp.setStrongestSubject("—");
            resp.setWeakestSubject("—");
            resp.setScoreProgress(new ArrayList<>());
            resp.setSubjectProgress(new ArrayList<>());
            resp.setTimeProgress(new ArrayList<>());
            resp.setAccuracyProgress(new ArrayList<>());
            return resp;
        }

        // Summary cards
        TestResult latest = all.get(0); // newest first
        resp.setTotalTests(all.size());
        resp.setLatestScore(latest.getTotalScore());
        resp.setBestScore(all.stream().mapToInt(TestResult::getTotalScore).max().orElse(0));
        resp.setAverageScore(all.stream().mapToInt(TestResult::getTotalScore).average().orElse(0));
        resp.setLatestAccuracy(latest.getAccuracyPercent());
        resp.setAverageAccuracy(all.stream().mapToDouble(TestResult::getAccuracyPercent).average().orElse(0));
        resp.setAverageTimeSecs((int) all.stream().mapToInt(TestResult::getOverallTimeSecs).average().orElse(0));

        // Strongest/Weakest subject across ALL attempts
        double physAvg = avgSubjectPct(all, "Physics");
        double chemAvg = avgSubjectPct(all, "Chemistry");
        double mathAvg = avgSubjectPct(all, "Mathematics");

        String strongest = physAvg >= chemAvg && physAvg >= mathAvg ? "Physics"
                : chemAvg >= mathAvg ? "Chemistry" : "Mathematics";
        String weakest = physAvg <= chemAvg && physAvg <= mathAvg ? "Physics"
                : chemAvg <= mathAvg ? "Chemistry" : "Mathematics";

        resp.setStrongestSubject(strongest);
        resp.setWeakestSubject(weakest);

        // Chart data points (chronological)
        List<AnalyticsResponse.ScoreDataPoint> scorePoints = new ArrayList<>();
        List<AnalyticsResponse.SubjectDataPoint> subPoints = new ArrayList<>();
        List<AnalyticsResponse.TimeDataPoint> timePoints = new ArrayList<>();
        List<AnalyticsResponse.AccuracyDataPoint> accPoints = new ArrayList<>();

        for (int i = 0; i < chronological.size(); i++) {
            TestResult t = chronological.get(i);
            String label = "Test " + (i + 1);

            double pct = t.getTotalMaxMarks() > 0
                    ? Math.round(t.getTotalScore() * 100.0 / t.getTotalMaxMarks() * 100) / 100.0
                    : 0;

            scorePoints.add(new AnalyticsResponse.ScoreDataPoint(
                    t.getId(), label, t.getTotalScore(), t.getTotalMaxMarks(), pct));

            accPoints.add(new AnalyticsResponse.AccuracyDataPoint(
                    t.getId(), label, t.getAccuracyPercent()));

            // Subject percentages
            double phyPct = subjectPct(t, "Physics");
            double chemPct = subjectPct(t, "Chemistry");
            double matPct = subjectPct(t, "Mathematics");
            subPoints.add(new AnalyticsResponse.SubjectDataPoint(
                    t.getId(), label, phyPct, chemPct, matPct));

            // Subject times
            int phySecs = subjectSecs(t, "Physics");
            int chemSecs = subjectSecs(t, "Chemistry");
            int matSecs = subjectSecs(t, "Mathematics");
            timePoints.add(new AnalyticsResponse.TimeDataPoint(
                    t.getId(), label, phySecs, chemSecs, matSecs, t.getOverallTimeSecs()));
        }

        resp.setScoreProgress(scorePoints);
        resp.setSubjectProgress(subPoints);
        resp.setTimeProgress(timePoints);
        resp.setAccuracyProgress(accPoints);

        return resp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private TestResultResponse toResponse(TestResult t) {
        List<SubjectResultResponse> subs = t.getSubjectResults() == null
                ? new ArrayList<>()
                : t.getSubjectResults().stream().map(s -> new SubjectResultResponse(
                        s.getId(), s.getSubjectName(), s.getMarksObtained(), s.getMaxMarks(),
                        s.getCorrect(), s.getWrong(), s.getAttempted(),
                        s.getTimeSecs(), s.getAccuracyPercent()
                )).collect(Collectors.toList());

        return new TestResultResponse(
                t.getId(), t.getSessionId(), t.getTestName(), t.getCompletedAt(),
                t.getOverallTimeSecs(), t.getTotalScore(), t.getTotalMaxMarks(),
                t.getTotalCorrect(), t.getTotalWrong(), t.getTotalAttempted(),
                t.getAccuracyPercent(), subs
        );
    }

    private int safe(Integer v) {
        return v != null ? v : 0;
    }

    private double subjectPct(TestResult t, String name) {
        if (t.getSubjectResults() == null) return 0;
        return t.getSubjectResults().stream()
                .filter(s -> name.equalsIgnoreCase(s.getSubjectName()))
                .findFirst()
                .map(s -> s.getMaxMarks() > 0
                        ? Math.round(s.getMarksObtained() * 100.0 / s.getMaxMarks() * 100) / 100.0
                        : 0.0)
                .orElse(0.0);
    }

    private int subjectSecs(TestResult t, String name) {
        if (t.getSubjectResults() == null) return 0;
        return t.getSubjectResults().stream()
                .filter(s -> name.equalsIgnoreCase(s.getSubjectName()))
                .findFirst()
                .map(SubjectResult::getTimeSecs)
                .orElse(0);
    }

    private double avgSubjectPct(List<TestResult> all, String name) {
        return all.stream().mapToDouble(t -> subjectPct(t, name)).average().orElse(0);
    }
}
