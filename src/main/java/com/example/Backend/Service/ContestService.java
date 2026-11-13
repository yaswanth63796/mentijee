package com.example.Backend.Service;

import com.example.Backend.DTO.*;
import com.example.Backend.Entity.*;
import com.example.Backend.Repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ContestService {

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private ContestQuestionRepository contestQuestionRepository;

    @Autowired
    private ContestAttemptRepository contestAttemptRepository;

    @Autowired
    private ContestAnswerRepository contestAnswerRepository;

    @Autowired
    private QuestionFileParserService questionFileParserService;

    @Autowired
    private LeaderboardWebSocketService leaderboardWebSocketService;

    // =========================================================================
    // ADMIN OPERATIONS
    // =========================================================================

    @Transactional
    public ContestResponse createContest(ContestRequest req) {
        validateContestSchedule(req.getStartTime(), req.getEndTime(), req.getDurationMinutes());

        Contest contest = Contest.builder()
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .instructions(req.getInstructions())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .durationMinutes(req.getDurationMinutes())
                .status(ContestStatus.DRAFT)
                .physicsTopics(req.getPhysicsTopics())
                .chemistryTopics(req.getChemistryTopics())
                .mathematicsTopics(req.getMathematicsTopics())
                .totalQuestions(15)
                .maxMarks(req.getCorrectMarks() != null ? req.getCorrectMarks() * 15 : 60)
                .correctMarks(req.getCorrectMarks() != null ? req.getCorrectMarks() : 4)
                .negativeMarks(req.getNegativeMarks() != null ? req.getNegativeMarks() : 1)
                .build();

        Contest saved = contestRepository.save(contest);
        return mapToContestResponse(saved);
    }

    @Transactional
    public ContestResponse updateContest(Long contestId, ContestRequest req) {
        Contest contest = getContestOrThrow(contestId);

        // Do not allow modifications if contest has started and has attempts
        if (LocalDateTime.now().isAfter(contest.getStartTime()) && contest.getStatus() == ContestStatus.PUBLISHED) {
            long attemptCount = contestAttemptRepository.countByContest(contest);
            if (attemptCount > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot modify a contest that is already active or has participant attempts");
            }
        }

        validateContestSchedule(req.getStartTime(), req.getEndTime(), req.getDurationMinutes());

        contest.setTitle(req.getTitle().trim());
        contest.setDescription(req.getDescription());
        contest.setInstructions(req.getInstructions());
        contest.setStartTime(req.getStartTime());
        contest.setEndTime(req.getEndTime());
        contest.setDurationMinutes(req.getDurationMinutes());
        contest.setPhysicsTopics(req.getPhysicsTopics());
        contest.setChemistryTopics(req.getChemistryTopics());
        contest.setMathematicsTopics(req.getMathematicsTopics());
        if (req.getCorrectMarks() != null) {
            contest.setCorrectMarks(req.getCorrectMarks());
            contest.setMaxMarks(req.getCorrectMarks() * 15);
        }
        if (req.getNegativeMarks() != null) {
            contest.setNegativeMarks(req.getNegativeMarks());
        }

        Contest saved = contestRepository.save(contest);
        return mapToContestResponse(saved);
    }

    @Transactional
    public FileValidationResponse uploadQuestions(Long contestId, MultipartFile file) {
        Contest contest = getContestOrThrow(contestId);

        if (LocalDateTime.now().isAfter(contest.getStartTime()) && contest.getStatus() == ContestStatus.PUBLISHED) {
            long attemptCount = contestAttemptRepository.countByContest(contest);
            if (attemptCount > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot replace questions for an ongoing or completed contest with participant attempts");
            }
        }

        FileValidationResponse validation = questionFileParserService.validateAndParseFile(file, contest);
        if (!validation.isValid()) {
            return validation;
        }

        // Transactionally replace questions
        contestQuestionRepository.deleteByContest(contest);

        // Sort questions: 5 Physics (1..5), 5 Chemistry (6..10), 5 Mathematics (11..15)
        List<QuestionImportDTO> all = validation.getPreviewQuestions();
        List<QuestionImportDTO> physics = all.stream()
                .filter(q -> "Physics".equalsIgnoreCase(QuestionFileParserService.normalizeSubjectName(q.getSubject())))
                .collect(Collectors.toList());
        List<QuestionImportDTO> chemistry = all.stream()
                .filter(q -> "Chemistry".equalsIgnoreCase(QuestionFileParserService.normalizeSubjectName(q.getSubject())))
                .collect(Collectors.toList());
        List<QuestionImportDTO> math = all.stream()
                .filter(q -> "Mathematics".equalsIgnoreCase(QuestionFileParserService.normalizeSubjectName(q.getSubject())))
                .collect(Collectors.toList());

        List<ContestQuestion> entities = new ArrayList<>();
        int order = 1;

        for (QuestionImportDTO dto : physics) {
            entities.add(mapImportToEntity(dto, contest, "Physics", order++));
        }
        for (QuestionImportDTO dto : chemistry) {
            entities.add(mapImportToEntity(dto, contest, "Chemistry", order++));
        }
        for (QuestionImportDTO dto : math) {
            entities.add(mapImportToEntity(dto, contest, "Mathematics", order++));
        }

        contestQuestionRepository.saveAll(entities);

        validation.setMessage("Successfully imported and saved all 15 questions transactionally.");
        return validation;
    }

    public FileValidationResponse previewQuestions(Long contestId, MultipartFile file) {
        Contest contest = getContestOrThrow(contestId);
        return questionFileParserService.validateAndParseFile(file, contest);
    }

    @Transactional
    public ContestResponse publishContest(Long contestId) {
        Contest contest = getContestOrThrow(contestId);

        long totalQ = contestQuestionRepository.countByContest(contest);
        long phyQ = contestQuestionRepository.countByContestAndSubjectNameIgnoreCase(contest, "Physics");
        long chemQ = contestQuestionRepository.countByContestAndSubjectNameIgnoreCase(contest, "Chemistry");
        long mathQ = contestQuestionRepository.countByContestAndSubjectNameIgnoreCase(contest, "Mathematics");

        if (totalQ != 15 || phyQ != 5 || chemQ != 5 || mathQ != 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Cannot publish contest. It must have exactly 15 questions (5 Physics, 5 Chemistry, 5 Mathematics). Current: Total=%d, Phy=%d, Chem=%d, Math=%d",
                            totalQ, phyQ, chemQ, mathQ));
        }

        contest.setStatus(ContestStatus.PUBLISHED);
        Contest saved = contestRepository.save(contest);
        return mapToContestResponse(saved);
    }

    @Transactional
    public ContestResponse cancelContest(Long contestId) {
        Contest contest = getContestOrThrow(contestId);
        contest.setStatus(ContestStatus.CANCELLED);
        Contest saved = contestRepository.save(contest);
        return mapToContestResponse(saved);
    }

    public List<ContestResponse> getAllContestsForAdmin() {
        return contestRepository.findAllByOrderByStartTimeDesc().stream()
                .map(this::mapToContestResponse)
                .collect(Collectors.toList());
    }

    public List<FullContestQuestionResponse> getContestQuestionsForAdmin(Long contestId) {
        Contest contest = getContestOrThrow(contestId);
        return contestQuestionRepository.findByContestOrderByQuestionOrderAsc(contest).stream()
                .map(q -> FullContestQuestionResponse.builder()
                        .id(q.getId())
                        .questionOrder(q.getQuestionOrder())
                        .subjectName(q.getSubjectName())
                        .topic(q.getTopic())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .difficulty(q.getDifficulty())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctAnswer(q.getCorrectAnswer())
                        .marks(q.getMarks())
                        .negativeMarks(q.getNegativeMarks())
                        .explanation(q.getExplanation())
                        .build())
                .collect(Collectors.toList());
    }

    public List<ContestAttempt> getContestAttemptsForAdmin(Long contestId) {
        return contestAttemptRepository.findAllAttemptsByContestId(contestId);
    }

    public Map<String, List<String>> getSubjectTopics() {
        Map<String, List<String>> result = new LinkedHashMap<>();

        List<String> physicsDefaults = Arrays.asList(
                "Kinematics",
                "Laws of Motion",
                "Work, Energy and Power",
                "Rotational Motion",
                "Gravitation",
                "Thermodynamics & Kinetic Theory",
                "Oscillations & Waves",
                "Electrostatics",
                "Current Electricity",
                "Magnetic Effects of Current & Magnetism",
                "Electromagnetic Induction & AC",
                "Optics (Ray & Wave)",
                "Modern Physics & Nuclear Physics",
                "Semiconductors & Communications"
        );

        List<String> chemistryDefaults = Arrays.asList(
                "Mole Concept & Stoichiometry",
                "Atomic Structure",
                "Chemical Bonding & Molecular Structure",
                "Chemical Thermodynamics",
                "Equilibrium (Chemical & Ionic)",
                "Redox Reactions & Electrochemistry",
                "Chemical Kinetics",
                "Solutions",
                "Periodic Classification & Periodicity",
                "Coordination Compounds & d/f-Block Elements",
                "p-Block Elements",
                "General Organic Chemistry (GOC)",
                "Hydrocarbons",
                "Haloalkanes and Haloarenes",
                "Alcohols, Phenols and Ethers",
                "Aldehydes, Ketones and Carboxylic Acids",
                "Amines & Biomolecules"
        );

        List<String> mathDefaults = Arrays.asList(
                "Sets, Relations and Functions",
                "Quadratic Equations & Complex Numbers",
                "Matrices and Determinants",
                "Permutations and Combinations",
                "Binomial Theorem & Sequences and Series",
                "Limits, Continuity and Differentiability",
                "Application of Derivatives",
                "Indefinite & Definite Integrals",
                "Differential Equations",
                "Coordinate Geometry (Lines, Circles, Conics)",
                "Three Dimensional Geometry & Vectors",
                "Probability & Statistics",
                "Trigonometry"
        );

        Set<String> physicsSet = new LinkedHashSet<>(physicsDefaults);
        Set<String> chemistrySet = new LinkedHashSet<>(chemistryDefaults);
        Set<String> mathSet = new LinkedHashSet<>(mathDefaults);

        try {
            List<String> dbPhy = contestQuestionRepository.findDistinctTopicsBySubjectName("Physics");
            if (dbPhy != null) physicsSet.addAll(dbPhy);
            List<String> dbChem = contestQuestionRepository.findDistinctTopicsBySubjectName("Chemistry");
            if (dbChem != null) chemistrySet.addAll(dbChem);
            List<String> dbMath = contestQuestionRepository.findDistinctTopicsBySubjectName("Mathematics");
            if (dbMath != null) mathSet.addAll(dbMath);
        } catch (Exception e) {
            log.warn("Could not fetch distinct topics from DB: {}", e.getMessage());
        }

        result.put("Physics", new ArrayList<>(physicsSet));
        result.put("Chemistry", new ArrayList<>(chemistrySet));
        result.put("Mathematics", new ArrayList<>(mathSet));
        return result;
    }

    private String normalizeSubject(String subject) {
        if (subject == null) return "Physics";
        String s = subject.trim().toLowerCase();
        if (s.contains("phy")) return "Physics";
        if (s.contains("chem")) return "Chemistry";
        if (s.contains("math")) return "Mathematics";
        return "Physics";
    }

    public void validateQuestion(ContestQuestionRequest q) {
        if (q.getQuestionText() == null || q.getQuestionText().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question text cannot be empty");
        }
        if (q.getSubjectName() == null || q.getSubjectName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required");
        }
        String normalizedSub = normalizeSubject(q.getSubjectName());
        if (!Arrays.asList("Physics", "Chemistry", "Mathematics").contains(normalizedSub)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject must be Physics, Chemistry, or Mathematics");
        }
        if (q.getTopic() == null || q.getTopic().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic or Chapter is required");
        }
        if (q.getQuestionType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question type is required (MCQ or NUMERICAL)");
        }
        if (q.getDifficulty() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Difficulty is required (EASY, MEDIUM, or HARD)");
        }
        if (q.getMarks() == null || q.getMarks() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Marks must be greater than 0");
        }
        if (q.getNegativeMarks() == null || q.getNegativeMarks() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Negative marks cannot be negative");
        }

        if (q.getQuestionType() == QuestionType.MCQ) {
            if (q.getOptionA() == null || q.getOptionA().trim().isEmpty() ||
                q.getOptionB() == null || q.getOptionB().trim().isEmpty() ||
                q.getOptionC() == null || q.getOptionC().trim().isEmpty() ||
                q.getOptionD() == null || q.getOptionD().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All 4 options (A, B, C, D) must be provided for MCQ questions");
            }
            if (q.getCorrectAnswer() == null || q.getCorrectAnswer().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct option must be selected for MCQ");
            }
            String ans = q.getCorrectAnswer().trim().toUpperCase();
            if (!Arrays.asList("A", "B", "C", "D").contains(ans)) {
                // If the user passed option text instead of label, check if it matches an option
                if (ans.equalsIgnoreCase(q.getOptionA().trim())) {
                    q.setCorrectAnswer("A");
                } else if (ans.equalsIgnoreCase(q.getOptionB().trim())) {
                    q.setCorrectAnswer("B");
                } else if (ans.equalsIgnoreCase(q.getOptionC().trim())) {
                    q.setCorrectAnswer("C");
                } else if (ans.equalsIgnoreCase(q.getOptionD().trim())) {
                    q.setCorrectAnswer("D");
                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct answer must be one of the 4 options: A, B, C, or D");
                }
            } else {
                q.setCorrectAnswer(ans);
            }
        } else if (q.getQuestionType() == QuestionType.NUMERICAL) {
            if (q.getCorrectAnswer() == null || q.getCorrectAnswer().trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Numerical correct answer must be provided");
            }
            try {
                Double.parseDouble(q.getCorrectAnswer().trim());
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct answer must be a valid numeric value for NUMERICAL questions");
            }
            if (q.getNumericalTolerance() == null) {
                q.setNumericalTolerance(0.0);
            }
        }
    }

    private void checkContestEditable(Contest contest) {
        if (LocalDateTime.now().isAfter(contest.getStartTime()) && contest.getStatus() == ContestStatus.PUBLISHED) {
            long attemptCount = contestAttemptRepository.countByContest(contest);
            if (attemptCount > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot modify questions for an ongoing or completed contest with participant attempts");
            }
        }
    }

    @Transactional
    public FullContestQuestionResponse addQuestion(Long contestId, ContestQuestionRequest req) {
        Contest contest = getContestOrThrow(contestId);
        checkContestEditable(contest);
        validateQuestion(req);

        String normalizedSub = normalizeSubject(req.getSubjectName());
        long currentCountInSub = contestQuestionRepository.countByContestAndSubjectNameIgnoreCase(contest, normalizedSub);
        if (currentCountInSub >= 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Subject " + normalizedSub + " already has maximum 5 questions");
        }

        long totalQuestions = contestQuestionRepository.countByContest(contest);
        int order = (int) (totalQuestions + 1);
        if (req.getQuestionOrder() != null && req.getQuestionOrder() > 0) {
            order = req.getQuestionOrder();
        }

        ContestQuestion q = ContestQuestion.builder()
                .contest(contest)
                .subjectName(normalizedSub)
                .topic(req.getTopic().trim())
                .questionOrder(order)
                .questionText(req.getQuestionText().trim())
                .questionType(req.getQuestionType())
                .difficulty(req.getDifficulty())
                .optionA(req.getOptionA() != null ? req.getOptionA().trim() : "")
                .optionB(req.getOptionB() != null ? req.getOptionB().trim() : "")
                .optionC(req.getOptionC() != null ? req.getOptionC().trim() : "")
                .optionD(req.getOptionD() != null ? req.getOptionD().trim() : "")
                .correctAnswer(req.getCorrectAnswer().trim())
                .numericalTolerance(req.getNumericalTolerance() != null ? req.getNumericalTolerance() : 0.0)
                .marks(req.getMarks() != null ? req.getMarks() : 4)
                .negativeMarks(req.getNegativeMarks() != null ? req.getNegativeMarks() : (req.getQuestionType() == QuestionType.NUMERICAL ? 0 : 1))
                .explanation(req.getExplanation() != null ? req.getExplanation().trim() : "")
                .build();

        ContestQuestion saved = contestQuestionRepository.save(q);
        reorderQuestions(contest);

        return FullContestQuestionResponse.builder()
                .id(saved.getId())
                .questionOrder(saved.getQuestionOrder())
                .subjectName(saved.getSubjectName())
                .topic(saved.getTopic())
                .questionText(saved.getQuestionText())
                .questionType(saved.getQuestionType())
                .difficulty(saved.getDifficulty())
                .optionA(saved.getOptionA())
                .optionB(saved.getOptionB())
                .optionC(saved.getOptionC())
                .optionD(saved.getOptionD())
                .correctAnswer(saved.getCorrectAnswer())
                .marks(saved.getMarks())
                .negativeMarks(saved.getNegativeMarks())
                .explanation(saved.getExplanation())
                .build();
    }

    @Transactional
    public FullContestQuestionResponse updateQuestion(Long contestId, Long questionId, ContestQuestionRequest req) {
        Contest contest = getContestOrThrow(contestId);
        checkContestEditable(contest);
        validateQuestion(req);

        ContestQuestion q = contestQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        if (!q.getContest().getId().equals(contest.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this contest");
        }

        String normalizedSub = normalizeSubject(req.getSubjectName());
        q.setSubjectName(normalizedSub);
        q.setTopic(req.getTopic().trim());
        q.setQuestionText(req.getQuestionText().trim());
        q.setQuestionType(req.getQuestionType());
        q.setDifficulty(req.getDifficulty());
        q.setOptionA(req.getOptionA() != null ? req.getOptionA().trim() : "");
        q.setOptionB(req.getOptionB() != null ? req.getOptionB().trim() : "");
        q.setOptionC(req.getOptionC() != null ? req.getOptionC().trim() : "");
        q.setOptionD(req.getOptionD() != null ? req.getOptionD().trim() : "");
        q.setCorrectAnswer(req.getCorrectAnswer().trim());
        q.setNumericalTolerance(req.getNumericalTolerance() != null ? req.getNumericalTolerance() : 0.0);
        q.setMarks(req.getMarks() != null ? req.getMarks() : 4);
        q.setNegativeMarks(req.getNegativeMarks() != null ? req.getNegativeMarks() : (req.getQuestionType() == QuestionType.NUMERICAL ? 0 : 1));
        q.setExplanation(req.getExplanation() != null ? req.getExplanation().trim() : "");

        ContestQuestion saved = contestQuestionRepository.save(q);
        reorderQuestions(contest);

        return FullContestQuestionResponse.builder()
                .id(saved.getId())
                .questionOrder(saved.getQuestionOrder())
                .subjectName(saved.getSubjectName())
                .topic(saved.getTopic())
                .questionText(saved.getQuestionText())
                .questionType(saved.getQuestionType())
                .difficulty(saved.getDifficulty())
                .optionA(saved.getOptionA())
                .optionB(saved.getOptionB())
                .optionC(saved.getOptionC())
                .optionD(saved.getOptionD())
                .correctAnswer(saved.getCorrectAnswer())
                .marks(saved.getMarks())
                .negativeMarks(saved.getNegativeMarks())
                .explanation(saved.getExplanation())
                .build();
    }

    @Transactional
    public void deleteQuestion(Long contestId, Long questionId) {
        Contest contest = getContestOrThrow(contestId);
        checkContestEditable(contest);

        ContestQuestion q = contestQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        if (!q.getContest().getId().equals(contest.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this contest");
        }

        contestQuestionRepository.delete(q);
        reorderQuestions(contest);
    }

    private void reorderQuestions(Contest contest) {
        List<ContestQuestion> all = contestQuestionRepository.findByContestOrderByQuestionOrderAsc(contest);
        List<ContestQuestion> physics = all.stream().filter(x -> "Physics".equalsIgnoreCase(x.getSubjectName())).collect(Collectors.toList());
        List<ContestQuestion> chem = all.stream().filter(x -> "Chemistry".equalsIgnoreCase(x.getSubjectName())).collect(Collectors.toList());
        List<ContestQuestion> math = all.stream().filter(x -> "Mathematics".equalsIgnoreCase(x.getSubjectName())).collect(Collectors.toList());

        int order = 1;
        for (ContestQuestion q : physics) {
            q.setQuestionOrder(order++);
        }
        for (ContestQuestion q : chem) {
            q.setQuestionOrder(order++);
        }
        for (ContestQuestion q : math) {
            q.setQuestionOrder(order++);
        }
        contestQuestionRepository.saveAll(all);
    }

    @Transactional
    public List<FullContestQuestionResponse> saveAllQuestions(Long contestId, List<ContestQuestionRequest> requests) {
        Contest contest = getContestOrThrow(contestId);
        checkContestEditable(contest);

        if (requests == null || requests.size() != 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Exactly 15 questions are required to save contest questions. Received: " + (requests == null ? 0 : requests.size()));
        }

        for (ContestQuestionRequest req : requests) {
            validateQuestion(req);
        }

        List<ContestQuestionRequest> physics = requests.stream()
                .filter(q -> "Physics".equalsIgnoreCase(normalizeSubject(q.getSubjectName())))
                .collect(Collectors.toList());
        List<ContestQuestionRequest> chemistry = requests.stream()
                .filter(q -> "Chemistry".equalsIgnoreCase(normalizeSubject(q.getSubjectName())))
                .collect(Collectors.toList());
        List<ContestQuestionRequest> math = requests.stream()
                .filter(q -> "Mathematics".equalsIgnoreCase(normalizeSubject(q.getSubjectName())))
                .collect(Collectors.toList());

        if (physics.size() != 5 || chemistry.size() != 5 || math.size() != 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Contest must have exactly 5 Physics, 5 Chemistry, and 5 Mathematics questions. Provided: Physics=%d, Chemistry=%d, Mathematics=%d",
                            physics.size(), chemistry.size(), math.size()));
        }

        // Transactionally delete previous and insert new
        contestQuestionRepository.deleteByContest(contest);

        List<ContestQuestion> entities = new ArrayList<>();
        int order = 1;

        for (ContestQuestionRequest r : physics) {
            entities.add(mapRequestToEntity(r, contest, "Physics", order++));
        }
        for (ContestQuestionRequest r : chemistry) {
            entities.add(mapRequestToEntity(r, contest, "Chemistry", order++));
        }
        for (ContestQuestionRequest r : math) {
            entities.add(mapRequestToEntity(r, contest, "Mathematics", order++));
        }

        List<ContestQuestion> saved = contestQuestionRepository.saveAll(entities);

        return saved.stream()
                .map(q -> FullContestQuestionResponse.builder()
                        .id(q.getId())
                        .questionOrder(q.getQuestionOrder())
                        .subjectName(q.getSubjectName())
                        .topic(q.getTopic())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .difficulty(q.getDifficulty())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctAnswer(q.getCorrectAnswer())
                        .marks(q.getMarks())
                        .negativeMarks(q.getNegativeMarks())
                        .explanation(q.getExplanation())
                        .build())
                .collect(Collectors.toList());
    }

    private ContestQuestion mapRequestToEntity(ContestQuestionRequest r, Contest contest, String subject, int order) {
        return ContestQuestion.builder()
                .contest(contest)
                .subjectName(subject)
                .topic(r.getTopic().trim())
                .questionOrder(order)
                .questionText(r.getQuestionText().trim())
                .questionType(r.getQuestionType())
                .difficulty(r.getDifficulty())
                .optionA(r.getOptionA() != null ? r.getOptionA().trim() : "")
                .optionB(r.getOptionB() != null ? r.getOptionB().trim() : "")
                .optionC(r.getOptionC() != null ? r.getOptionC().trim() : "")
                .optionD(r.getOptionD() != null ? r.getOptionD().trim() : "")
                .correctAnswer(r.getCorrectAnswer().trim())
                .numericalTolerance(r.getNumericalTolerance() != null ? r.getNumericalTolerance() : 0.0)
                .marks(r.getMarks() != null ? r.getMarks() : 4)
                .negativeMarks(r.getNegativeMarks() != null ? r.getNegativeMarks() : (r.getQuestionType() == QuestionType.NUMERICAL ? 0 : 1))
                .explanation(r.getExplanation() != null ? r.getExplanation().trim() : "")
                .build();
    }

    // =========================================================================
    // STUDENT OPERATIONS
    // =========================================================================

    public List<ContestResponse> getPublishedContests() {
        return contestRepository.findPublishedContests().stream()
                .map(this::mapToContestResponse)
                .collect(Collectors.toList());
    }

    public ContestResponse getContestDetails(Long contestId) {
        Contest contest = getContestOrThrow(contestId);
        return mapToContestResponse(contest);
    }

    @Transactional
    public ContestJoinResponse joinContest(Long contestId, ContestJoinRequest req) {
        Contest contest = getContestOrThrow(contestId);

        if (contest.getStatus() != ContestStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest is not active or published");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(contest.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest has not started yet. Starts at " + contest.getStartTime());
        }
        if (now.isAfter(contest.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest has already ended at " + contest.getEndTime());
        }

        String email = req.getParticipantEmail() != null ? req.getParticipantEmail().trim().toLowerCase() : "anonymous@mentijee.com";
        String name = req.getParticipantName() != null && !req.getParticipantName().isBlank()
                ? req.getParticipantName().trim() : "Contestant";

        // Check if existing attempt exists for this email
        Optional<ContestAttempt> existing = contestAttemptRepository.findByContestAndParticipantEmail(contest, email);
        ContestAttempt attempt;

        if (existing.isPresent()) {
            attempt = existing.get();
        } else {
            // New attempt
            LocalDateTime startedAt = now;
            // Fairness rule: deadline cannot exceed contest.endTime!
            LocalDateTime candidateDeadline = startedAt.plusMinutes(contest.getDurationMinutes());
            LocalDateTime deadline = candidateDeadline.isBefore(contest.getEndTime()) ? candidateDeadline : contest.getEndTime();

            attempt = ContestAttempt.builder()
                    .contest(contest)
                    .participantName(name)
                    .participantEmail(email)
                    .sessionId(UUID.randomUUID().toString())
                    .startedAt(startedAt)
                    .deadline(deadline)
                    .isSubmitted(false)
                    .totalScore(0)
                    .maxMarks(contest.getMaxMarks())
                    .totalCorrect(0)
                    .totalWrong(0)
                    .totalUnanswered(15)
                    .totalAttempted(0)
                    .accuracyPercent(0.0)
                    .completionTimeSecs(0)
                    .build();

            attempt = contestAttemptRepository.save(attempt);
        }

        return buildJoinResponse(attempt);
    }

    @Transactional
    public ContestJoinResponse resumeAttempt(Long contestId, String sessionId) {
        ContestAttempt attempt = getAttemptBySessionOrThrow(sessionId);

        // Check if deadline has passed
        LocalDateTime now = LocalDateTime.now();
        if (!attempt.getIsSubmitted() && now.isAfter(attempt.getDeadline())) {
            // Auto submit attempt
            submitContest(contestId, SubmitContestRequest.builder().sessionId(sessionId).build());
            attempt = getAttemptBySessionOrThrow(sessionId);
        }

        return buildJoinResponse(attempt);
    }

    public List<SafeContestQuestionResponse> getSafeContestQuestions(Long contestId, String sessionId) {
        ContestAttempt attempt = getAttemptBySessionOrThrow(sessionId);

        if (!attempt.getContest().getId().equals(contestId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session does not belong to this contest");
        }

        // Return questions with strictly NO correct answers and NO explanations
        return contestQuestionRepository.findByContestOrderByQuestionOrderAsc(attempt.getContest()).stream()
                .map(q -> SafeContestQuestionResponse.builder()
                        .id(q.getId())
                        .questionOrder(q.getQuestionOrder())
                        .subjectName(q.getSubjectName())
                        .topic(q.getTopic())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .difficulty(q.getDifficulty())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .marks(q.getMarks())
                        .negativeMarks(q.getNegativeMarks())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveAnswer(Long contestId, Long questionId, SaveAnswerRequest req) {
        ContestAttempt attempt = getAttemptBySessionOrThrow(req.getSessionId());

        if (attempt.getIsSubmitted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest attempt is already submitted");
        }

        LocalDateTime now = LocalDateTime.now();
        // Allow 10 seconds grace period for network latency
        if (now.isAfter(attempt.getDeadline().plusSeconds(10))) {
            submitContest(contestId, SubmitContestRequest.builder().sessionId(req.getSessionId()).build());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest time expired. Attempt auto-submitted.");
        }

        ContestQuestion question = contestQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        if (!question.getContest().getId().equals(contestId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this contest");
        }

        Optional<ContestAnswer> existingOpt = contestAnswerRepository.findByContestAttemptAndQuestion(attempt, question);
        ContestAnswer answer = existingOpt.orElseGet(() -> ContestAnswer.builder()
                .contestAttempt(attempt)
                .question(question)
                .build());

        answer.setSelectedOption(req.getSelectedOption() != null ? req.getSelectedOption().trim() : null);
        if (req.getIsMarkedForReview() != null) {
            answer.setIsMarkedForReview(req.getIsMarkedForReview());
        }

        contestAnswerRepository.save(answer);
    }

    @Transactional
    public ContestResultResponse submitContest(Long contestId, SubmitContestRequest req) {
        ContestAttempt attempt = getAttemptBySessionOrThrow(req.getSessionId());

        // Idempotency: if already submitted, return the existing result
        if (attempt.getIsSubmitted()) {
            return buildResultResponse(attempt);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime submittedAt = now.isBefore(attempt.getDeadline()) ? now : attempt.getDeadline();
        attempt.setSubmittedAt(submittedAt);
        attempt.setIsSubmitted(true);

        long secondsTaken = Math.max(0, Duration.between(attempt.getStartedAt(), submittedAt).toSeconds());
        attempt.setCompletionTimeSecs((int) secondsTaken);

        // Save any batch answers sent with submit
        if (req.getAnswers() != null && !req.getAnswers().isEmpty()) {
            final ContestAttempt curAttempt = attempt;
            for (Map.Entry<Long, String> entry : req.getAnswers().entrySet()) {
                Long qId = entry.getKey();
                String option = entry.getValue();
                contestQuestionRepository.findById(qId).ifPresent(q -> {
                    Optional<ContestAnswer> ansOpt = contestAnswerRepository.findByContestAttemptAndQuestion(curAttempt, q);
                    ContestAnswer ans = ansOpt.orElseGet(() -> ContestAnswer.builder()
                            .contestAttempt(curAttempt)
                            .question(q)
                            .build());
                    ans.setSelectedOption(option != null ? option.trim() : null);
                    contestAnswerRepository.save(ans);
                });
            }
        }

        // Evaluate all 15 questions
        List<ContestQuestion> allQuestions = contestQuestionRepository.findByContestOrderByQuestionOrderAsc(attempt.getContest());
        Map<Long, ContestAnswer> answerMap = contestAnswerRepository.findByContestAttempt(attempt).stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (a1, a2) -> a1));

        int totalScore = 0;
        int totalCorrect = 0;
        int totalWrong = 0;
        int totalAttempted = 0;

        int phyScore = 0, phyCorrect = 0, phyAttempted = 0;
        int chemScore = 0, chemCorrect = 0, chemAttempted = 0;
        int mathScore = 0, mathCorrect = 0, mathAttempted = 0;

        for (ContestQuestion q : allQuestions) {
            ContestAnswer ans = answerMap.get(q.getId());
            boolean isAttempted = ans != null && ans.getSelectedOption() != null && !ans.getSelectedOption().isBlank();
            boolean isCorrect = false;
            int marksAwarded = 0;

            if (isAttempted) {
                totalAttempted++;
                String selected = ans.getSelectedOption().trim();

                if (q.getQuestionType() == QuestionType.MCQ) {
                    isCorrect = selected.equalsIgnoreCase(q.getCorrectAnswer().trim());
                } else if (q.getQuestionType() == QuestionType.NUMERICAL) {
                    try {
                        double userVal = Double.parseDouble(selected);
                        double correctVal = Double.parseDouble(q.getCorrectAnswer().trim());
                        double tol = q.getNumericalTolerance() != null ? q.getNumericalTolerance() : 0.0;
                        isCorrect = Math.abs(userVal - correctVal) <= tol;
                    } catch (Exception ignored) {
                        isCorrect = false;
                    }
                }

                if (isCorrect) {
                    marksAwarded = q.getMarks();
                    totalCorrect++;
                } else {
                    marksAwarded = (q.getQuestionType() == QuestionType.MCQ) ? -q.getNegativeMarks() : 0;
                    totalWrong++;
                }

                ans.setIsCorrect(isCorrect);
                ans.setMarksAwarded(marksAwarded);
                contestAnswerRepository.save(ans);
            }

            totalScore += marksAwarded;

            // Subject breakdown
            String sub = QuestionFileParserService.normalizeSubjectName(q.getSubjectName());
            if ("Physics".equals(sub)) {
                phyScore += marksAwarded;
                if (isAttempted) phyAttempted++;
                if (isCorrect) phyCorrect++;
            } else if ("Chemistry".equals(sub)) {
                chemScore += marksAwarded;
                if (isAttempted) chemAttempted++;
                if (isCorrect) chemCorrect++;
            } else if ("Mathematics".equals(sub)) {
                mathScore += marksAwarded;
                if (isAttempted) mathAttempted++;
                if (isCorrect) mathCorrect++;
            }
        }

        int totalUnanswered = 15 - totalAttempted;
        double accuracy = totalAttempted > 0 ? (totalCorrect * 100.0 / totalAttempted) : 0.0;

        attempt.setTotalScore(totalScore);
        attempt.setTotalCorrect(totalCorrect);
        attempt.setTotalWrong(totalWrong);
        attempt.setTotalAttempted(totalAttempted);
        attempt.setTotalUnanswered(totalUnanswered);
        attempt.setAccuracyPercent(Math.round(accuracy * 10.0) / 10.0);

        attempt.setPhysicsScore(phyScore);
        attempt.setPhysicsCorrect(phyCorrect);
        attempt.setPhysicsAttempted(phyAttempted);

        attempt.setChemistryScore(chemScore);
        attempt.setChemistryCorrect(chemCorrect);
        attempt.setChemistryAttempted(chemAttempted);

        attempt.setMathematicsScore(mathScore);
        attempt.setMathematicsCorrect(mathCorrect);
        attempt.setMathematicsAttempted(mathAttempted);

        contestAttemptRepository.save(attempt);

        // Recalculate deterministic ranks for all submitted attempts in this contest
        recalculateContestRanks(contestId);

        // Fetch refreshed attempt with rank
        attempt = contestAttemptRepository.findById(attempt.getId()).orElse(attempt);

        // Broadcast updated leaderboard via WebSocket
        try {
            ContestLeaderboardResponse lb = getContestLeaderboard(contestId, null);
            leaderboardWebSocketService.broadcastLeaderboard(contestId, lb);
        } catch (Exception e) {
            log.error("Error broadcasting leaderboard update: {}", e.getMessage());
        }

        return buildResultResponse(attempt);
    }

    public ContestResultResponse getParticipantResult(Long contestId, String sessionId) {
        ContestAttempt attempt = getAttemptBySessionOrThrow(sessionId);
        if (!attempt.getIsSubmitted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest is not submitted yet");
        }
        return buildResultResponse(attempt);
    }

    /**
     * Deterministic Leaderboard Ranking:
     * 1. Higher total marks
     * 2. Higher number of correct answers
     * 3. Higher accuracy
     * 4. Lower total completion time as final tie-breaker
     * Uses competition ranking (1, 2, 2, 4)
     */
    public ContestLeaderboardResponse getContestLeaderboard(Long contestId, String currentSessionId) {
        Contest contest = getContestOrThrow(contestId);
        List<ContestAttempt> submittedAttempts = contestAttemptRepository.findLeaderboardByContestId(contestId);

        int totalParticipants = (int) contestAttemptRepository.countByContest(contest);
        double avgScore = submittedAttempts.stream()
                .mapToInt(ContestAttempt::getTotalScore)
                .average()
                .orElse(0.0);
        int highestScore = submittedAttempts.stream()
                .mapToInt(ContestAttempt::getTotalScore)
                .max()
                .orElse(0);

        List<LeaderboardEntryResponse> top10 = new ArrayList<>();
        LeaderboardEntryResponse currentUserEntry = null;

        for (int i = 0; i < submittedAttempts.size(); i++) {
            ContestAttempt a = submittedAttempts.get(i);
            boolean isCurrentUser = currentSessionId != null && currentSessionId.equals(a.getSessionId());

            LeaderboardEntryResponse entry = LeaderboardEntryResponse.builder()
                    .rank(a.getRank() != null && a.getRank() > 0 ? a.getRank() : i + 1)
                    .participantName(sanitizeParticipantName(a.getParticipantName()))
                    .totalScore(a.getTotalScore())
                    .totalCorrect(a.getTotalCorrect())
                    .accuracyPercent(a.getAccuracyPercent())
                    .completionTimeSecs(a.getCompletionTimeSecs())
                    .submittedAt(a.getSubmittedAt())
                    .isCurrentParticipant(isCurrentUser)
                    .build();

            if (i < 10) {
                top10.add(entry);
            }
            if (isCurrentUser) {
                currentUserEntry = entry;
            }
        }

        return ContestLeaderboardResponse.builder()
                .contestId(contest.getId())
                .contestTitle(contest.getTitle())
                .contestStatus(contest.getDynamicState())
                .totalParticipants(totalParticipants)
                .averageScore(Math.round(avgScore * 10.0) / 10.0)
                .highestScore(highestScore)
                .top10(top10)
                .currentUserEntry(currentUserEntry)
                .build();
    }

    private void recalculateContestRanks(Long contestId) {
        List<ContestAttempt> list = contestAttemptRepository.findLeaderboardByContestId(contestId);
        if (list.isEmpty()) return;

        int currentRank = 1;
        for (int i = 0; i < list.size(); i++) {
            ContestAttempt current = list.get(i);
            if (i > 0) {
                ContestAttempt prev = list.get(i - 1);
                boolean tied = Objects.equals(current.getTotalScore(), prev.getTotalScore())
                        && Objects.equals(current.getTotalCorrect(), prev.getTotalCorrect())
                        && Objects.equals(current.getAccuracyPercent(), prev.getAccuracyPercent())
                        && Objects.equals(current.getCompletionTimeSecs(), prev.getCompletionTimeSecs());
                if (!tied) {
                    currentRank = i + 1;
                }
            }
            current.setRank(currentRank);
        }
        contestAttemptRepository.saveAll(list);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private Contest getContestOrThrow(Long contestId) {
        return contestRepository.findById(contestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found with id: " + contestId));
    }

    private ContestAttempt getAttemptBySessionOrThrow(String sessionId) {
        return contestAttemptRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found for session: " + sessionId));
    }

    private void validateContestSchedule(LocalDateTime start, LocalDateTime end, Integer durationMinutes) {
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end times are required");
        }
        if (!end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (durationMinutes == null || durationMinutes <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must be greater than 0 minutes");
        }
        long windowMinutes = Duration.between(start, end).toMinutes();
        if (durationMinutes > windowMinutes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Duration (" + durationMinutes + " mins) cannot exceed contest window (" + windowMinutes + " mins)");
        }
    }

    private ContestQuestion mapImportToEntity(QuestionImportDTO dto, Contest contest, String subjectName, int order) {
        return ContestQuestion.builder()
                .contest(contest)
                .subjectName(subjectName)
                .topic(dto.getTopic() != null ? dto.getTopic().trim() : subjectName + " Core")
                .questionOrder(order)
                .questionText(dto.getQuestionText().trim())
                .questionType(QuestionType.valueOf(dto.getQuestionType().trim().toUpperCase()))
                .difficulty(Difficulty.valueOf(dto.getDifficulty().trim().toUpperCase()))
                .optionA(dto.getOptionA())
                .optionB(dto.getOptionB())
                .optionC(dto.getOptionC())
                .optionD(dto.getOptionD())
                .correctAnswer(dto.getCorrectAnswer().trim())
                .numericalTolerance(dto.getNumericalTolerance() != null ? dto.getNumericalTolerance() : 0.0)
                .marks(dto.getMarks() != null ? dto.getMarks() : 4)
                .negativeMarks(dto.getNegativeMarks() != null ? dto.getNegativeMarks() : (dto.getQuestionType().equalsIgnoreCase("MCQ") ? 1 : 0))
                .explanation(dto.getExplanation())
                .build();
    }

    private ContestResponse mapToContestResponse(Contest c) {
        long pCount = contestAttemptRepository.countByContest(c);
        long sCount = contestAttemptRepository.countByContestAndIsSubmittedTrue(c);
        long qCount = contestQuestionRepository.countByContest(c);

        return ContestResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .instructions(c.getInstructions())
                .startTime(c.getStartTime())
                .endTime(c.getEndTime())
                .durationMinutes(c.getDurationMinutes())
                .status(c.getStatus())
                .dynamicState(c.getDynamicState())
                .physicsTopics(c.getPhysicsTopics())
                .chemistryTopics(c.getChemistryTopics())
                .mathematicsTopics(c.getMathematicsTopics())
                .totalQuestions(c.getTotalQuestions())
                .maxMarks(c.getMaxMarks())
                .correctMarks(c.getCorrectMarks())
                .negativeMarks(c.getNegativeMarks())
                .participantCount(pCount)
                .submissionCount(sCount)
                .questionsCount(qCount)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private ContestJoinResponse buildJoinResponse(ContestAttempt attempt) {
        LocalDateTime now = LocalDateTime.now();
        long remainingSecs = 0;
        if (!attempt.getIsSubmitted()) {
            remainingSecs = Math.max(0, Duration.between(now, attempt.getDeadline()).toSeconds());
        }

        Map<Long, String> savedAnswers = new HashMap<>();
        Map<Long, Boolean> markedForReview = new HashMap<>();

        for (ContestAnswer a : attempt.getAnswers()) {
            if (a.getSelectedOption() != null) {
                savedAnswers.put(a.getQuestion().getId(), a.getSelectedOption());
            }
            if (Boolean.TRUE.equals(a.getIsMarkedForReview())) {
                markedForReview.put(a.getQuestion().getId(), true);
            }
        }

        return ContestJoinResponse.builder()
                .sessionId(attempt.getSessionId())
                .attemptId(attempt.getId())
                .contestId(attempt.getContest().getId())
                .contestTitle(attempt.getContest().getTitle())
                .participantName(attempt.getParticipantName())
                .participantEmail(attempt.getParticipantEmail())
                .startedAt(attempt.getStartedAt())
                .deadline(attempt.getDeadline())
                .remainingSeconds(remainingSecs)
                .isSubmitted(attempt.getIsSubmitted())
                .savedAnswers(savedAnswers)
                .markedForReview(markedForReview)
                .build();
    }

    private ContestResultResponse buildResultResponse(ContestAttempt attempt) {
        List<ContestQuestion> allQuestions = contestQuestionRepository.findByContestOrderByQuestionOrderAsc(attempt.getContest());
        Map<Long, ContestAnswer> answerMap = contestAnswerRepository.findByContestAttempt(attempt).stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (a1, a2) -> a1));

        List<FullContestQuestionResponse> questionResponses = allQuestions.stream().map(q -> {
            ContestAnswer ans = answerMap.get(q.getId());
            return FullContestQuestionResponse.builder()
                    .id(q.getId())
                    .questionOrder(q.getQuestionOrder())
                    .subjectName(q.getSubjectName())
                    .topic(q.getTopic())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .difficulty(q.getDifficulty())
                    .optionA(q.getOptionA())
                    .optionB(q.getOptionB())
                    .optionC(q.getOptionC())
                    .optionD(q.getOptionD())
                    .correctAnswer(q.getCorrectAnswer())
                    .userSelectedAnswer(ans != null ? ans.getSelectedOption() : null)
                    .isCorrect(ans != null ? ans.getIsCorrect() : false)
                    .isMarkedForReview(ans != null ? ans.getIsMarkedForReview() : false)
                    .marksAwarded(ans != null ? ans.getMarksAwarded() : 0)
                    .marks(q.getMarks())
                    .negativeMarks(q.getNegativeMarks())
                    .explanation(q.getExplanation())
                    .build();
        }).collect(Collectors.toList());

        return ContestResultResponse.builder()
                .attemptId(attempt.getId())
                .contestId(attempt.getContest().getId())
                .contestTitle(attempt.getContest().getTitle())
                .participantName(attempt.getParticipantName())
                .participantEmail(attempt.getParticipantEmail())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .completionTimeSecs(attempt.getCompletionTimeSecs())
                .totalScore(attempt.getTotalScore())
                .maxMarks(attempt.getMaxMarks())
                .totalCorrect(attempt.getTotalCorrect())
                .totalWrong(attempt.getTotalWrong())
                .totalUnanswered(attempt.getTotalUnanswered())
                .totalAttempted(attempt.getTotalAttempted())
                .accuracyPercent(attempt.getAccuracyPercent())
                .rank(attempt.getRank())
                .physicsScore(attempt.getPhysicsScore())
                .chemistryScore(attempt.getChemistryScore())
                .mathematicsScore(attempt.getMathematicsScore())
                .physicsCorrect(attempt.getPhysicsCorrect())
                .chemistryCorrect(attempt.getChemistryCorrect())
                .mathematicsCorrect(attempt.getMathematicsCorrect())
                .physicsAttempted(attempt.getPhysicsAttempted())
                .chemistryAttempted(attempt.getChemistryAttempted())
                .mathematicsAttempted(attempt.getMathematicsAttempted())
                .questions(questionResponses)
                .build();
    }

    private String sanitizeParticipantName(String name) {
        if (name == null || name.isBlank()) return "Anonymous";
        // Hide email format if participant entered email as name
        if (name.contains("@")) {
            String[] parts = name.split("@");
            return parts[0];
        }
        return name;
    }
}
