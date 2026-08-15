package com.example.Backend.Controller;


import com.example.Backend.Entity.Subject;
import com.example.Backend.Service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/subjects")
public class SubjectController {


    @Autowired
     SubjectService service;


    @PostMapping("/add")

     public Subject addsubject(@RequestBody Subject sub){

         service.addsubject(sub);
         return sub;


     }

     @GetMapping("/get")

    public List<Subject> getsubjects(){

       return service.getsubjects();
     }


     @GetMapping("/{subject_id}")
     public Subject getsubjectByid(@PathVariable Long subject_id){

        return service.getsubjectByid(subject_id);
     }

    @DeleteMapping("/{subject_id}")
      public String deletesubject(@PathVariable Long subject_id){

        service.deletesubject(subject_id);
        return "Deleted sucessfuully";
      }

}
