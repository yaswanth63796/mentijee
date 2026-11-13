package com.example.Backend.Service;

import com.example.Backend.DTO.AuthResponse;
import com.example.Backend.Entity.User;
import com.example.Backend.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepo repo;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    public String registerUser(User user) {
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("USER");
        }
        repo.save(user);
        return "User Registered Successfully";
    }

    public String login(String email, String password) {
        User user = repo.findByEmail(email);

        if (user == null) {
            return "User Not found";
        }

        boolean matches = passwordEncoder.matches(password, user.getPassword()) || user.getPassword().equals(password);
        if (matches) {
            return "User login Successfully";
        } else {
            return "Invalid Email or password";
        }
    }

    public AuthResponse authenticate(String email, String password) {
        User user = repo.findByEmail(email);
        if (user == null) {
            return AuthResponse.builder()
                    .status("error")
                    .message("User not found")
                    .build();
        }

        boolean matches = passwordEncoder.matches(password, user.getPassword()) || user.getPassword().equals(password);
        if (!matches) {
            return AuthResponse.builder()
                    .status("error")
                    .message("Invalid email or password")
                    .build();
        }

        return AuthResponse.builder()
                .status("success")
                .message("Login successful")
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public User getUserByEmail(String email) {
        return repo.findByEmail(email);
    }
}
