package com.example.Backend.Service;

import com.example.Backend.Entity.User;
import com.example.Backend.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;

public class UserService {


    @Autowired
    private UserRepo repo;
    public String registerUser(User user) {

        repo.save(user);
        return "Users Registered Sucesfully";


    }

    public String login(String email, String password) {


        User user=repo.getbyemail(email);

        if(user==null){
            return "Users Not found";
        }

        if(user.getPassword().equals(password)){
            return "User login Sucessfully";
        }
        else{
            return "Invalid Email or password";
        }
    }
}
