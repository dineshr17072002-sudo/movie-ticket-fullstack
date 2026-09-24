package MovieApp.apk.Model;

import jakarta.persistence.*;
import lombok.*;

    @Entity
    @Table(name = "movies")
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public class Movie {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false)
        private String title;

        @Column(nullable = false)
        private String genre;

        @Column(nullable = false)
        private String director;

        @Column(nullable = false)
        private Integer releaseYear;

        @Column(length = 1000)
        private String description;

        private Double rating;
    }

