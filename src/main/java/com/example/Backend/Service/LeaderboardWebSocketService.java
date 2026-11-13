package com.example.Backend.Service;

import com.example.Backend.DTO.ContestLeaderboardResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LeaderboardWebSocketService {

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public void broadcastLeaderboard(Long contestId, ContestLeaderboardResponse leaderboard) {
        if (messagingTemplate == null || contestId == null || leaderboard == null) {
            return;
        }
        String destination = "/topic/contest/" + contestId + "/leaderboard";
        try {
            messagingTemplate.convertAndSend(destination, leaderboard);
        } catch (Exception e) {
            log.error("Failed to broadcast leaderboard to {}: {}", destination, e.getMessage());
        }
    }
}
