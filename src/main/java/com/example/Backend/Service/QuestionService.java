package com.example.Backend.Service;

import com.example.Backend.DTO.AnswerResponse;
import com.example.Backend.DTO.QuestionResponse;
import com.example.Backend.Entity.Option;
import com.example.Backend.Entity.Question;
import com.example.Backend.Repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    @Autowired
    QuestionRepository repo;

    public List<Question> getall() {
        return repo.findAll();
    }

    public QuestionResponse getQuestion(Long subjectId, int questionNumber) {

        List<Question> questions =
                repo.findBySubjectSubjectIdOrderByIdAsc(subjectId);

        if (questionNumber < 1 || questionNumber > questions.size()) {
            throw new RuntimeException("Question not found");
        }

        Question question = questions.get(questionNumber - 1);

        return new QuestionResponse(
                question.getId(),
                question.getQuestionText(),
                question.getQuestionType().name(),
                question.getDifficulty().name(),
                question.getMarks(),
                question.getOptions()
        );
    }

    public AnswerResponse checkAnswer(Long questionId, String answer) {

        Question question = repo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        boolean correct =
                question.getCorrectAnswer().equalsIgnoreCase(answer);

        Integer score = correct ? question.getMarks() : 0;

        Long nextQuestion = questionId + 1;

        return new AnswerResponse(
                correct,
                score,
                correct ? null : question.getCorrectAnswer(),
                correct ? null : question.getExplanation(),
                nextQuestion
        );
    }
}