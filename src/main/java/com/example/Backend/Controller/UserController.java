package com.example.Backend.Controller;


import com.example.Backend.Entity.User;
import com.example.Backend.Service.MyUserDetailsService;
import com.example.Backend.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserController {

     @Autowired
     private UserService service;

    BCryptPasswordEncoder passwordEncoder=new BCryptPasswordEncoder(12);

    @PostMapping("/register")
    public User register(@RequestBody User user){
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        service.registerUser(user);
        return user;
    }

    @PostMapping("/login")

    public String  loginuser(@RequestBody User user){

        return service.login(

                user.getEmail(),
                user.getPassword()

        );
    }
}
