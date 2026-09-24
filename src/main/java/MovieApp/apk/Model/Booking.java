package MovieApp.apk.Model;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name="bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;

    private String email;

    private Integer seats;

    private Double totalPrice;

    @ManyToOne
    @JoinColumn(name="movie_id")
    private Movie movie;
}
