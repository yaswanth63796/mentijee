package com.example.Backend.Service;

import com.example.Backend.DTO.FileValidationResponse;
import com.example.Backend.DTO.QuestionImportDTO;
import com.example.Backend.DTO.ValidationErrorDTO;
import com.example.Backend.Entity.Contest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class QuestionFileParserService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<String> VALID_SUBJECTS = Set.of("PHYSICS", "CHEMISTRY", "MATHEMATICS");
    private static final Set<String> VALID_TYPES = Set.of("MCQ", "NUMERICAL");
    private static final Set<String> VALID_DIFFICULTIES = Set.of("EASY", "MEDIUM", "HARD");

    public FileValidationResponse validateAndParseFile(MultipartFile file, Contest contest) {
        if (file == null || file.isEmpty()) {
            return FileValidationResponse.builder()
                    .valid(false)
                    .message("Uploaded file is empty or missing")
                    .errors(List.of(new ValidationErrorDTO(0, "file", "No file provided")))
                    .build();
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            filename = "";
        }
        String lowerFilename = filename.toLowerCase();

        List<QuestionImportDTO> parsedQuestions = new ArrayList<>();
        List<ValidationErrorDTO> errors = new ArrayList<>();

        try {
            if (lowerFilename.endsWith(".json")) {
                parseJson(file.getInputStream(), parsedQuestions, errors);
            } else if (lowerFilename.endsWith(".csv")) {
                parseCsv(file.getInputStream(), parsedQuestions, errors);
            } else if (lowerFilename.endsWith(".xlsx") || lowerFilename.endsWith(".xls")) {
                parseExcel(file.getInputStream(), parsedQuestions, errors);
            } else {
                return FileValidationResponse.builder()
                        .valid(false)
                        .message("Unsupported file format. Please upload .xlsx, .csv, or .json file.")
                        .errors(List.of(new ValidationErrorDTO(0, "format", "Supported formats: .xlsx, .csv, .json")))
                        .build();
            }
        } catch (Exception e) {
            return FileValidationResponse.builder()
                    .valid(false)
                    .message("Failed to parse file: " + e.getMessage())
                    .errors(List.of(new ValidationErrorDTO(0, "parsing", e.getMessage())))
                    .build();
        }

        // Validate individual questions
        for (QuestionImportDTO q : parsedQuestions) {
            validateSingleQuestion(q, errors, contest);
        }

        // Aggregate validation: exactly 5 Physics, 5 Chemistry, 5 Mathematics, 15 total
        Map<String, Integer> counts = new HashMap<>();
        counts.put("Physics", 0);
        counts.put("Chemistry", 0);
        counts.put("Mathematics", 0);

        for (QuestionImportDTO q : parsedQuestions) {
            String normSubject = normalizeSubjectName(q.getSubject());
            if (normSubject != null) {
                counts.put(normSubject, counts.getOrDefault(normSubject, 0) + 1);
            }
        }

        if (parsedQuestions.size() != 15) {
            errors.add(new ValidationErrorDTO(0, "totalQuestions",
                    "Contest must have exactly 15 questions, but found " + parsedQuestions.size()));
        }

        if (counts.get("Physics") != 5) {
            errors.add(new ValidationErrorDTO(0, "physicsCount",
                    "Physics must have exactly 5 questions, but found " + counts.get("Physics")));
        }
        if (counts.get("Chemistry") != 5) {
            errors.add(new ValidationErrorDTO(0, "chemistryCount",
                    "Chemistry must have exactly 5 questions, but found " + counts.get("Chemistry")));
        }
        if (counts.get("Mathematics") != 5) {
            errors.add(new ValidationErrorDTO(0, "mathematicsCount",
                    "Mathematics must have exactly 5 questions, but found " + counts.get("Mathematics")));
        }

        boolean isValid = errors.isEmpty();
        String message = isValid
                ? "File validated successfully! 15 valid questions found (5 Physics, 5 Chemistry, 5 Mathematics)."
                : "Validation failed with " + errors.size() + " issue(s). Please fix the errors and re-upload.";

        return FileValidationResponse.builder()
                .valid(isValid)
                .message(message)
                .totalQuestionsFound(parsedQuestions.size())
                .subjectCounts(counts)
                .errors(errors)
                .previewQuestions(parsedQuestions)
                .build();
    }

    private void parseJson(InputStream is, List<QuestionImportDTO> questions, List<ValidationErrorDTO> errors) throws Exception {
        JsonNode root = objectMapper.readTree(is);
        if (root.isArray()) {
            int row = 1;
            for (JsonNode node : root) {
                questions.add(mapJsonNodeToDTO(node, row++));
            }
        } else if (root.has("questions") && root.get("questions").isArray()) {
            int row = 1;
            for (JsonNode node : root.get("questions")) {
                questions.add(mapJsonNodeToDTO(node, row++));
            }
        } else {
            errors.add(new ValidationErrorDTO(0, "structure", "JSON must contain an array of question objects"));
        }
    }

    private QuestionImportDTO mapJsonNodeToDTO(JsonNode n, int row) {
        return QuestionImportDTO.builder()
                .rowNumber(row)
                .subject(getText(n, "subject", "subjectName"))
                .topic(getText(n, "topic", "chapter"))
                .questionText(getText(n, "questionText", "question", "text"))
                .questionType(getText(n, "questionType", "type"))
                .difficulty(getText(n, "difficulty", "level"))
                .optionA(getText(n, "optionA", "option_a", "a"))
                .optionB(getText(n, "optionB", "option_b", "b"))
                .optionC(getText(n, "optionC", "option_c", "c"))
                .optionD(getText(n, "optionD", "option_d", "d"))
                .correctAnswer(getText(n, "correctAnswer", "correct_answer", "answer"))
                .numericalTolerance(getDouble(n, "numericalTolerance", "tolerance", 0.0))
                .marks(getInt(n, "marks", 4))
                .negativeMarks(getInt(n, "negativeMarks", "negative_marks", 1))
                .explanation(getText(n, "explanation", "solution"))
                .build();
    }

    private void parseCsv(InputStream is, List<QuestionImportDTO> questions, List<ValidationErrorDTO> errors) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        CSVParser parser = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build()
                .parse(reader);

        int row = 2; // header is row 1
        for (CSVRecord record : parser) {
            QuestionImportDTO q = QuestionImportDTO.builder()
                    .rowNumber(row)
                    .subject(getRecordField(record, "subject", "subject_name"))
                    .topic(getRecordField(record, "topic", "chapter"))
                    .questionText(getRecordField(record, "question_text", "question", "questiontext"))
                    .questionType(getRecordField(record, "question_type", "type"))
                    .difficulty(getRecordField(record, "difficulty", "level"))
                    .optionA(getRecordField(record, "option_a", "optiona", "a"))
                    .optionB(getRecordField(record, "option_b", "optionb", "b"))
                    .optionC(getRecordField(record, "option_c", "optionc", "c"))
                    .optionD(getRecordField(record, "option_d", "optiond", "d"))
                    .correctAnswer(getRecordField(record, "correct_answer", "correctanswer", "answer"))
                    .numericalTolerance(parseDouble(getRecordField(record, "numerical_tolerance", "tolerance"), 0.0))
                    .marks(parseInt(getRecordField(record, "marks"), 4))
                    .negativeMarks(parseInt(getRecordField(record, "negative_marks", "negativemarks"), 1))
                    .explanation(getRecordField(record, "explanation", "solution"))
                    .build();
            questions.add(q);
            row++;
        }
    }

    private void parseExcel(InputStream is, List<QuestionImportDTO> questions, List<ValidationErrorDTO> errors) throws Exception {
        Workbook workbook = new XSSFWorkbook(is);
        Sheet sheet = workbook.getSheetAt(0);

        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            errors.add(new ValidationErrorDTO(1, "header", "Excel file is missing header row"));
            workbook.close();
            return;
        }

        Map<String, Integer> colMap = new HashMap<>();
        for (Cell cell : headerRow) {
            String val = getCellValueAsString(cell).trim().toLowerCase().replaceAll("[\\s_-]", "");
            colMap.put(val, cell.getColumnIndex());
        }

        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null || isRowEmpty(row)) continue;

            QuestionImportDTO q = QuestionImportDTO.builder()
                    .rowNumber(r + 1)
                    .subject(getExcelField(row, colMap, "subject", "subjectname"))
                    .topic(getExcelField(row, colMap, "topic", "chapter"))
                    .questionText(getExcelField(row, colMap, "questiontext", "question"))
                    .questionType(getExcelField(row, colMap, "questiontype", "type"))
                    .difficulty(getExcelField(row, colMap, "difficulty", "level"))
                    .optionA(getExcelField(row, colMap, "optiona", "a"))
                    .optionB(getExcelField(row, colMap, "optionb", "b"))
                    .optionC(getExcelField(row, colMap, "optionc", "c"))
                    .optionD(getExcelField(row, colMap, "optiond", "d"))
                    .correctAnswer(getExcelField(row, colMap, "correctanswer", "answer"))
                    .numericalTolerance(parseDouble(getExcelField(row, colMap, "numericaltolerance", "tolerance"), 0.0))
                    .marks(parseInt(getExcelField(row, colMap, "marks"), 4))
                    .negativeMarks(parseInt(getExcelField(row, colMap, "negativemarks"), 1))
                    .explanation(getExcelField(row, colMap, "explanation", "solution"))
                    .build();
            questions.add(q);
        }
        workbook.close();
    }

    private void validateSingleQuestion(QuestionImportDTO q, List<ValidationErrorDTO> errors, Contest contest) {
        int r = q.getRowNumber();

        // 1. Question text
        if (q.getQuestionText() == null || q.getQuestionText().isBlank()) {
            errors.add(new ValidationErrorDTO(r, "questionText", "Question text cannot be empty"));
        }

        // 2. Subject
        if (q.getSubject() == null || q.getSubject().isBlank()) {
            errors.add(new ValidationErrorDTO(r, "subject", "Subject is required (Physics, Chemistry, or Mathematics)"));
        } else {
            String norm = normalizeSubjectName(q.getSubject());
            if (norm == null) {
                errors.add(new ValidationErrorDTO(r, "subject",
                        "Invalid subject '" + q.getSubject() + "'. Must be Physics, Chemistry, or Mathematics"));
            }
        }

        // 3. Question Type
        String type = q.getQuestionType() != null ? q.getQuestionType().trim().toUpperCase() : "";
        if (!VALID_TYPES.contains(type)) {
            errors.add(new ValidationErrorDTO(r, "questionType", "Invalid question type '" + q.getQuestionType() + "'. Must be MCQ or NUMERICAL"));
        }

        // 4. Difficulty
        String diff = q.getDifficulty() != null ? q.getDifficulty().trim().toUpperCase() : "";
        if (!VALID_DIFFICULTIES.contains(diff)) {
            errors.add(new ValidationErrorDTO(r, "difficulty", "Invalid difficulty '" + q.getDifficulty() + "'. Must be EASY, MEDIUM, or HARD"));
        }

        // 5. Correct Answer & Options
        if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank()) {
            errors.add(new ValidationErrorDTO(r, "correctAnswer", "Correct answer is required"));
        } else if ("MCQ".equalsIgnoreCase(type)) {
            String ans = q.getCorrectAnswer().trim().toUpperCase();
            if (!Set.of("A", "B", "C", "D").contains(ans)) {
                errors.add(new ValidationErrorDTO(r, "correctAnswer", "For MCQ, correct answer must be A, B, C, or D (got '" + q.getCorrectAnswer() + "')"));
            }
            if (q.getOptionA() == null || q.getOptionA().isBlank()) {
                errors.add(new ValidationErrorDTO(r, "optionA", "Option A is required for MCQ"));
            }
            if (q.getOptionB() == null || q.getOptionB().isBlank()) {
                errors.add(new ValidationErrorDTO(r, "optionB", "Option B is required for MCQ"));
            }
            if (q.getOptionC() == null || q.getOptionC().isBlank()) {
                errors.add(new ValidationErrorDTO(r, "optionC", "Option C is required for MCQ"));
            }
            if (q.getOptionD() == null || q.getOptionD().isBlank()) {
                errors.add(new ValidationErrorDTO(r, "optionD", "Option D is required for MCQ"));
            }
        } else if ("NUMERICAL".equalsIgnoreCase(type)) {
            try {
                Double.parseDouble(q.getCorrectAnswer().trim());
            } catch (NumberFormatException e) {
                errors.add(new ValidationErrorDTO(r, "correctAnswer", "For NUMERICAL, correct answer must be a valid number (got '" + q.getCorrectAnswer() + "')"));
            }
        }
    }

    public static String normalizeSubjectName(String name) {
        if (name == null) return null;
        String upper = name.trim().toUpperCase();
        if (upper.startsWith("PHY")) return "Physics";
        if (upper.startsWith("CHEM")) return "Chemistry";
        if (upper.startsWith("MATH")) return "Mathematics";
        return null;
    }

    private String getText(JsonNode node, String... keys) {
        for (String k : keys) {
            if (node.has(k) && !node.get(k).isNull()) {
                return node.get(k).asText().trim();
            }
        }
        return null;
    }

    private int getInt(JsonNode node, String key, int def) {
        if (node.has(key) && !node.get(key).isNull()) {
            return node.get(key).asInt(def);
        }
        return def;
    }

    private int getInt(JsonNode node, String key1, String key2, int def) {
        if (node.has(key1) && !node.get(key1).isNull()) return node.get(key1).asInt(def);
        if (node.has(key2) && !node.get(key2).isNull()) return node.get(key2).asInt(def);
        return def;
    }

    private double getDouble(JsonNode node, String key1, String key2, double def) {
        if (node.has(key1) && !node.get(key1).isNull()) return node.get(key1).asDouble(def);
        if (node.has(key2) && !node.get(key2).isNull()) return node.get(key2).asDouble(def);
        return def;
    }

    private String getRecordField(CSVRecord record, String... names) {
        for (String n : names) {
            if (record.isMapped(n)) {
                String val = record.get(n);
                if (val != null) return val.trim();
            }
        }
        return null;
    }

    private String getExcelField(Row row, Map<String, Integer> colMap, String... keys) {
        for (String k : keys) {
            String normKey = k.toLowerCase().replaceAll("[\\s_-]", "");
            Integer colIdx = colMap.get(normKey);
            if (colIdx != null) {
                Cell cell = row.getCell(colIdx);
                if (cell != null) {
                    return getCellValueAsString(cell).trim();
                }
            }
        }
        return null;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    yield String.valueOf((long) val);
                } else {
                    yield String.valueOf(val);
                }
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellValueAsString(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private int parseInt(String val, int def) {
        if (val == null || val.isBlank()) return def;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private double parseDouble(String val, double def) {
        if (val == null || val.isBlank()) return def;
        try {
            return Double.parseDouble(val.trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }

    public String generateSampleCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("subject,topic,question_type,difficulty,question_text,option_a,option_b,option_c,option_d,correct_answer,numerical_tolerance,marks,negative_marks,explanation\n");

        // 5 Physics
        for (int i = 1; i <= 5; i++) {
            if (i <= 4) {
                sb.append(String.format("Physics,Kinematics & Dynamics,MCQ,MEDIUM,\"Physics Question %d: A particle moves in a straight line with uniform acceleration. Find its displacement after 5 seconds.\",\"25 m\",\"50 m\",\"75 m\",\"100 m\",B,0,4,1,\"Using equation of motion s = ut + 0.5at^2, displacement equals 50 m.\"\n", i));
            } else {
                sb.append("Physics,Thermodynamics,NUMERICAL,HARD,\"Physics Question 5: An ideal gas undergoes isothermal expansion doing 120 J of work. Find heat absorbed in Joules.\",\"\",\"\",\"\",\"\",120,0.1,4,0,\"For isothermal process dU = 0, so Q = W = 120 J.\"\n");
            }
        }

        // 5 Chemistry
        for (int i = 1; i <= 5; i++) {
            if (i <= 4) {
                sb.append(String.format("Chemistry,Chemical Bonding,MCQ,MEDIUM,\"Chemistry Question %d: Which of the following molecules has a linear molecular geometry according to VSEPR theory?\",\"H2O\",\"BeCl2\",\"SO2\",\"NH3\",B,0,4,1,\"BeCl2 has 2 bond pairs and 0 lone pairs with sp hybridization, making it linear.\"\n", i));
            } else {
                sb.append("Chemistry,Atomic Structure,NUMERICAL,EASY,\"Chemistry Question 5: What is the maximum number of electrons that can be accommodated in the 3d subshell?\",\"\",\"\",\"\",\"\",10,0,4,0,\"A d subshell has 5 orbitals, each holding 2 electrons = 10 electrons.\"\n");
            }
        }

        // 5 Mathematics
        for (int i = 1; i <= 5; i++) {
            if (i <= 4) {
                sb.append(String.format("Mathematics,Calculus & Vectors,MCQ,HARD,\"Mathematics Question %d: Find the limit as x approaches 0 of sin(3x)/x.\",\"1\",\"2\",\"3\",\"0\",C,0,4,1,\"Standard limit lim_{x->0} sin(kx)/x = k, hence the limit is 3.\"\n", i));
            } else {
                sb.append("Mathematics,Coordinate Geometry,NUMERICAL,MEDIUM,\"Mathematics Question 5: Find the radius of the circle given by the equation x^2 + y^2 = 49.\",\"\",\"\",\"\",\"\",7,0,4,0,\"Standard form x^2 + y^2 = r^2 gives r = sqrt(49) = 7.\"\n");
            }
        }

        return sb.toString();
    }

    public String generateSampleJson() throws Exception {
        List<Map<String, Object>> list = new ArrayList<>();

        // 5 Physics
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("subject", "Physics");
            q.put("topic", i <= 4 ? "Kinematics & Dynamics" : "Thermodynamics");
            q.put("questionType", i <= 4 ? "MCQ" : "NUMERICAL");
            q.put("difficulty", i <= 2 ? "EASY" : (i <= 4 ? "MEDIUM" : "HARD"));
            q.put("questionText", i <= 4
                    ? "Physics Q" + i + ": A block of mass 2 kg on a frictionless horizontal plane is pulled by a 10 N force. Find acceleration in m/s^2."
                    : "Physics Q5: What is the work done in Joules by an ideal gas during an isobaric expansion at 100 kPa from 1 m^3 to 2.5 m^3?");
            if (i <= 4) {
                q.put("optionA", "2.5 m/s^2");
                q.put("optionB", "5.0 m/s^2");
                q.put("optionC", "7.5 m/s^2");
                q.put("optionD", "10.0 m/s^2");
                q.put("correctAnswer", "B");
            } else {
                q.put("optionA", "");
                q.put("optionB", "");
                q.put("optionC", "");
                q.put("optionD", "");
                q.put("correctAnswer", "150000");
                q.put("numericalTolerance", 1.0);
            }
            q.put("marks", 4);
            q.put("negativeMarks", i <= 4 ? 1 : 0);
            q.put("explanation", i <= 4 ? "F = ma => a = F/m = 10/2 = 5 m/s^2." : "W = P * dV = 100000 * 1.5 = 150000 J.");
            list.add(q);
        }

        // 5 Chemistry
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("subject", "Chemistry");
            q.put("topic", "Atomic Structure & Chemical Bonding");
            q.put("questionType", i <= 4 ? "MCQ" : "NUMERICAL");
            q.put("difficulty", "MEDIUM");
            q.put("questionText", i <= 4
                    ? "Chemistry Q" + i + ": Which molecule among the following exhibits zero dipole moment?"
                    : "Chemistry Q5: What is the oxidation state of Chromium in K2Cr2O7?");
            if (i <= 4) {
                q.put("optionA", "NH3");
                q.put("optionB", "H2O");
                q.put("optionC", "CCl4");
                q.put("optionD", "HCl");
                q.put("correctAnswer", "C");
            } else {
                q.put("optionA", "");
                q.put("optionB", "");
                q.put("optionC", "");
                q.put("optionD", "");
                q.put("correctAnswer", "6");
                q.put("numericalTolerance", 0.0);
            }
            q.put("marks", 4);
            q.put("negativeMarks", i <= 4 ? 1 : 0);
            q.put("explanation", i <= 4 ? "CCl4 has tetrahedral symmetry, dipole moments cancel out." : "2(+1) + 2(x) + 7(-2) = 0 => 2x = 12 => x = +6.");
            list.add(q);
        }

        // 5 Mathematics
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("subject", "Mathematics");
            q.put("topic", "Calculus & Coordinate Geometry");
            q.put("questionType", i <= 4 ? "MCQ" : "NUMERICAL");
            q.put("difficulty", i <= 2 ? "EASY" : "HARD");
            q.put("questionText", i <= 4
                    ? "Mathematics Q" + i + ": The derivative of f(x) = e^(2x) * cos(x) at x = 0 is:"
                    : "Mathematics Q5: Find the area under y = 2x from x = 0 to x = 4.");
            if (i <= 4) {
                q.put("optionA", "1");
                q.put("optionB", "2");
                q.put("optionC", "0");
                q.put("optionD", "-1");
                q.put("correctAnswer", "B");
            } else {
                q.put("optionA", "");
                q.put("optionB", "");
                q.put("optionC", "");
                q.put("optionD", "");
                q.put("correctAnswer", "16");
                q.put("numericalTolerance", 0.0);
            }
            q.put("marks", 4);
            q.put("negativeMarks", i <= 4 ? 1 : 0);
            q.put("explanation", i <= 4 ? "f'(x) = 2e^(2x)cos(x) - e^(2x)sin(x). At x=0, f'(0) = 2(1)(1) - 0 = 2." : "Integral of 2x dx from 0 to 4 is [x^2]_0^4 = 16.");
            list.add(q);
        }

        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(list);
    }
}
