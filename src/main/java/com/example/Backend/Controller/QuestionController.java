package com.example.Backend.Controller;


import com.example.Backend.Entity.Question;
import com.example.Backend.Service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {


    @Autowired
    QuestionService service;

    @GetMapping("/get")
    public List<Question> getall(){

        return service.getall();

    }
}
