
package com.example.Backend.Entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;


@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
 @Table(name="student_details")


public class Student{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;
     private String name;
     private String email;
     private String password;
}