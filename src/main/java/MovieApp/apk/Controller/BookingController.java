package MovieApp.apk.Controller;

import MovieApp.apk.Model.Booking;
import MovieApp.apk.Service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins="http://localhost:3001")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public Booking saveBooking(@RequestBody Booking booking){
        return bookingService.saveBooking(booking);
    }

    @GetMapping
    public List<Booking> getBookings(){
        return bookingService.getAllBookings();
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable Long id){
        bookingService.deleteBooking(id);
    }
}