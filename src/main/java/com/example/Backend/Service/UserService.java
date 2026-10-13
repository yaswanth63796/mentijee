package com.example.Backend.Service;

import com.example.Backend.Entity.User;
import com.example.Backend.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepo repo;

    public String registerUser(User user) {
        repo.save(user);
        return "User Registered Successfully";
    }

    public String login(String email, String password) {
        User user = repo.findByEmail(email);

        if (user == null) {
            return "User Not found";
        }

        // NOTE: Password should be compared with BCrypt, not plain equals.
        // The /login endpoint encodes the password before calling this, so this
        // comparison will always fail. Spring Security form login handles auth properly.
        // This manual login endpoint is insecure and will not work correctly with
        // BCrypt-encoded passwords. Consider removing it and using Spring Security's
        // built-in authentication instead.
        if (user.getPassword().equals(password)) {
            return "User login Successfully";
        } else {
            return "Invalid Email or password";
        }
    }
}
