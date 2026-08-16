import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getQuestionBySubjectAndNumber = async (subjectId, questionNumber) => {
  const response = await api.get(`/api/questions/subject/${subjectId}/question/${questionNumber}`);
  return response.data;
};

export const checkAnswer = async (questionId, selectedAnswer) => {
  const response = await api.post(
    `/api/questions/${questionId}/answer?answer=${encodeURIComponent(selectedAnswer)}`
  );
  return response.data;
};

export default api;
