
package  com.example.Backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;


@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name="subject_details")
public class Subject{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long subject_id;
    @Column(nullable = false, unique = true)
    private String name;
}