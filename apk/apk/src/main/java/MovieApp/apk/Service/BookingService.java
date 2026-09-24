package MovieApp.apk.Service;

import MovieApp.apk.Model.Booking;
import MovieApp.apk.Repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    public Booking saveBooking(Booking booking){
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings(){
        return bookingRepository.findAll();
    }

    public void deleteBooking(Long id){
        bookingRepository.deleteById(id);
    }
}