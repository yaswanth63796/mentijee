package com.example.Backend.Repository;

import com.example.Backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<User,Integer> {

    User getbyemail(String email) ;


}
