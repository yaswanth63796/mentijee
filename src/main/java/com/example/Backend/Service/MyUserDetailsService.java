package com.example.Backend.Service;

import com.example.Backend.Entity.User;
import com.example.Backend.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.example.Backend.Entity.UserPrincipal;

public class MyUserDetailsService implements UserDetailsService {



    @Autowired
   UserRepo repo;


    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {


        User user=repo.getbyemail(email);

        if(user==null){
            throw new UsernameNotFoundException("Users not found");


        }


        return new UserPrincipal(user);
    }
}
