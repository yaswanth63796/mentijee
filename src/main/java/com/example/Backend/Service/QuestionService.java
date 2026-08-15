package com.example.Backend.Service;


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
}
