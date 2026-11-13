package com.example.Backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitContestRequest {
    private String sessionId;
    // Optional final batch of answers in case client submits with answers
    private Map<Long, String> answers;
}
