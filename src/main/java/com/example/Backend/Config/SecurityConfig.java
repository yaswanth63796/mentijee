package com.example.Backend.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.proxy.NoOp;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

public class SecurityConfig {


    @Autowired
    UserDetailsService service;

public SecurityFilterChain securityFilterChain(HttpSecurity http){

    http.csrf(Customizer->Customizer.disable());
    http.authorizeHttpRequests(Request->Request.anyRequest().authenticated()); //authorize any http requests
    http.formLogin(Customizer.withDefaults());  //gives login to browser
    http.httpBasic(Customizer.withDefaults());  //gives suthentication to postman
    // http.sessionManagement(Session->Session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));  //each time it creates session Id
    return http.build();
}

    public AuthenticationProvider authenticationProvider(){


        DaoAuthenticationProvider provider=new DaoAuthenticationProvider(service);
        provider.setPasswordEncoder(new BCryptPasswordEncoder(12));


        return provider;

    }
}
