package com.example.Backend.Service;

import com.example.Backend.DTO.AnswerResponse;
import com.example.Backend.DTO.QuestionResponse;
import com.example.Backend.Entity.Question;
import com.example.Backend.Repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {

    @Autowired
    QuestionRepository repo;


    // Get all questions
    public List<Question> getall() {
        return repo.findAll();
    }


    // Get one question
    public QuestionResponse getQuestion(
            Long subjectId,
            int questionNumber) {

        List<Question> questions =
                repo.findQuestionsBySubjectId(subjectId);

        if (questions.isEmpty()) {
            throw new RuntimeException(
                    "No questions found for subject: " + subjectId
            );
        }

        if (questionNumber < 1 ||
                questionNumber > questions.size()) {

            throw new RuntimeException(
                    "Question number " +
                            questionNumber +
                            " not found"
            );
        }

        Question question =
                questions.get(questionNumber - 1);

        return new QuestionResponse(
                question.getId(),
                question.getQuestionText(),
                question.getQuestionType().name(),
                question.getDifficulty().name(),
                question.getMarks(),
                question.getOptions()
        );
    }


    // Check answer + find next question
    public AnswerResponse checkAnswer(
            Long questionId,
            String answer) {

        Question question =
                repo.findById(questionId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Question not found"
                                )
                        );

        boolean correct =
                question.getCorrectAnswer()
                        .equalsIgnoreCase(answer);

        Integer score =
                correct
                        ? question.getMarks()
                        : 0;


        // Get questions belonging to same subject
        List<Question> questions =
                repo.findQuestionsBySubjectId(
                        question.getSubject()
                                .getSubject_id()
                );


        // Find current question
        int currentIndex = -1;

        for (int i = 0; i < questions.size(); i++) {

            if (questions.get(i)
                    .getId()
                    .equals(question.getId())) {

                currentIndex = i;
                break;
            }
        }


        // Find next question
        Long nextQuestion = null;

        if (currentIndex != -1 &&
                currentIndex + 1 < questions.size()) {

            nextQuestion =
                    questions
                            .get(currentIndex + 1)
                            .getId();
        }


        return new AnswerResponse(
                correct,
                score,

                correct
                        ? null
                        : question.getCorrectAnswer(),

                correct
                        ? null
                        : question.getExplanation(),

                nextQuestion
        );
    }
}