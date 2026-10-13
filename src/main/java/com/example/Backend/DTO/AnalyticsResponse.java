package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnalyticsResponse {

    /** Summary cards */
    private Integer totalTests;
    private Integer latestScore;
    private Integer bestScore;
    private Double averageScore;
    private Double latestAccuracy;
    private Double averageAccuracy;
    private Integer averageTimeSecs;
    private String strongestSubject;
    private String weakestSubject;

    /** Data points for trend charts — one per completed test */
    private List<ScoreDataPoint> scoreProgress;
    private List<SubjectDataPoint> subjectProgress;
    private List<TimeDataPoint> timeProgress;
    private List<AccuracyDataPoint> accuracyProgress;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ScoreDataPoint {
        private Long testId;
        private String label;      // attempt number or date
        private Integer score;
        private Integer maxMarks;
        private Double percentage;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SubjectDataPoint {
        private Long testId;
        private String label;
        private Double physicsPercent;
        private Double chemistryPercent;
        private Double mathsPercent;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TimeDataPoint {
        private Long testId;
        private String label;
        private Integer physicsSecs;
        private Integer chemistrySecs;
        private Integer mathsSecs;
        private Integer overallSecs;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AccuracyDataPoint {
        private Long testId;
        private String label;
        private Double accuracy;
    }
}
