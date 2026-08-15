package com.example.Backend.Controller;

import com.example.Backend.DTO.AnswerResponse;
import com.example.Backend.DTO.QuestionResponse;
import com.example.Backend.Entity.Question;
import com.example.Backend.Service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired
    QuestionService service;

    // Existing API
    @GetMapping("/get")
    public List<Question> getall() {
        return service.getall();
    }

    // Get ONE question
    @GetMapping("/subject/{subject_id}/question/{questionNumber}")
    public QuestionResponse getQuestion(
            @PathVariable Long subject_id,
            @PathVariable int questionNumber) {

        return service.getQuestion(subject_id, questionNumber);
    }

    // Check answer
    @PostMapping("/{questionId}/answer")
    public AnswerResponse checkAnswer(
            @PathVariable Long questionId,
            @RequestParam String answer) {

        return service.checkAnswer(questionId, answer);
    }
}
