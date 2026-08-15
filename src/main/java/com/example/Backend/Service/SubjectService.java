package com.example.Backend.Service;


import com.example.Backend.Entity.Subject;
import com.example.Backend.Repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SubjectService {

      @Autowired
      SubjectRepository repo;
    public void  addsubject(Subject sub) {
        repo.save(sub);


    }

    public List<Subject> getsubjects() {

        return repo.findAll();
    }

    public Subject getsubjectByid(Long subjectId) {
        
        Optional<Subject> subject=repo.findById(subjectId);

        return subject.orElse(null);
    }

    public void deletesubject(Long subjectId) {
        repo.deleteById(subjectId);
    }
}
