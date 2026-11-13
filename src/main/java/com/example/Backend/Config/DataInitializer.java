package com.example.Backend.Config;

import com.example.Backend.Entity.*;
import com.example.Backend.Repository.*;
import com.example.Backend.Service.QuestionFileParserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private ContestQuestionRepository contestQuestionRepository;

    @Autowired
    private QuestionFileParserService questionFileParserService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Override
    public void run(String... args) throws Exception {
        User existingAdmin = userRepo.findByEmail("admin@mentijee.com");
        if (existingAdmin == null) {
            User admin = new User();
            admin.setName("MentiJEE Administrator");
            admin.setEmail("admin@mentijee.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole("ADMIN");
            admin.setGender("N/A");
            userRepo.save(admin);
            System.out.println(">>> Created default Admin account: admin@mentijee.com / Admin@123");
        }

        // Seed initial published contest if no contests exist
        if (contestRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            Contest contest = Contest.builder()
                    .title("All-India JEE Premier Challenge #1")
                    .description("The national benchmark timed contest covering core JEE Main & Advanced syllabus in Physics, Chemistry, and Mathematics.")
                    .instructions("1. Each correct answer carries +4 marks.\n2. Each incorrect MCQ answer carries -1 mark.\n3. Numerical questions carry 0 negative marks.\n4. You must complete all 15 questions within 60 minutes.\n5. Auto-submission occurs immediately upon deadline.")
                    .startTime(now.minusHours(1))
                    .endTime(now.plusDays(7))
                    .durationMinutes(60)
                    .status(ContestStatus.PUBLISHED)
                    .physicsTopics("Kinematics, Laws of Motion, Thermodynamics")
                    .chemistryTopics("Atomic Structure, Chemical Bonding")
                    .mathematicsTopics("Calculus, Coordinate Geometry")
                    .totalQuestions(15)
                    .maxMarks(60)
                    .correctMarks(4)
                    .negativeMarks(1)
                    .build();

            Contest savedContest = contestRepository.save(contest);

            // Seed the 15 questions using questionFileParserService sample JSON
            String json = questionFileParserService.generateSampleJson();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode array = mapper.readTree(json);

            List<ContestQuestion> qList = new ArrayList<>();
            int order = 1;
            for (JsonNode n : array) {
                String sub = n.get("subject").asText();
                ContestQuestion q = ContestQuestion.builder()
                        .contest(savedContest)
                        .subjectName(sub)
                        .topic(n.has("topic") ? n.get("topic").asText() : sub + " Core")
                        .questionOrder(order++)
                        .questionText(n.get("questionText").asText())
                        .questionType(QuestionType.valueOf(n.get("questionType").asText()))
                        .difficulty(Difficulty.valueOf(n.get("difficulty").asText()))
                        .optionA(n.has("optionA") ? n.get("optionA").asText() : "")
                        .optionB(n.has("optionB") ? n.get("optionB").asText() : "")
                        .optionC(n.has("optionC") ? n.get("optionC").asText() : "")
                        .optionD(n.has("optionD") ? n.get("optionD").asText() : "")
                        .correctAnswer(n.get("correctAnswer").asText())
                        .numericalTolerance(n.has("numericalTolerance") ? n.get("numericalTolerance").asDouble() : 0.0)
                        .marks(n.has("marks") ? n.get("marks").asInt() : 4)
                        .negativeMarks(n.has("negativeMarks") ? n.get("negativeMarks").asInt() : 1)
                        .explanation(n.has("explanation") ? n.get("explanation").asText() : "")
                        .build();
                qList.add(q);
            }

            contestQuestionRepository.saveAll(qList);
            System.out.println(">>> Seeded initial active contest: All-India JEE Premier Challenge #1 with 15 questions.");
        }
    }
}
