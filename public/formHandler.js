document.addEventListener('DOMContentLoaded', () => {
    const clientForm = document.getElementById('client-form');
    const hotelForm = document.getElementById('hotel-form');
    const bookingForm = document.getElementById('booking-form');
    const clientList = document.getElementById('client-list');
    const hotelList = document.getElementById('hotel-list');
    const bookingList = document.getElementById('booking-list');
    const clientSelect = document.getElementById('clientName');
    const hotelSelect = document.getElementById('hotelName');

    // Fetch and display clients
    const fetchClients = async () => {
        const res = await fetch('/api/clients');
        const clients = await res.json();
        clientList.innerHTML = '';
        clientSelect.innerHTML = '<option value="">Выберите клиента</option>';
        clients.forEach(client => {
            clientList.innerHTML += `<li>${client.name} <sup class="d-desc">(${client.contact})</sup></li>`;
            clientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`;
        });
    };

    // Fetch and display hotels
    const fetchHotels = async () => {
        const res = await fetch('/api/hotels');
        const hotels = await res.json();
        hotelList.innerHTML = '';
        hotelSelect.innerHTML = '<option value="">Выберите отель</option>';
        hotels.forEach(hotel => {
            hotelList.innerHTML += `<li>${hotel.name} - ${hotel.location} <sup class="d-desc">(${hotel.free_rooms} мест)</sup></li>`;
            hotelSelect.innerHTML += `<option value="${hotel.id}">${hotel.name}</option>`;
        });
    };

    // Fetch and display bookings
    const fetchBookings = async () => {
        const res = await fetch('/api/bookings');
        const bookings = await res.json();
        bookingList.innerHTML = '';
        bookings.forEach(booking => {
            bookingList.innerHTML += `<li>${booking.client_name} забронировал ${booking.rooms_booked} мест в ${booking.hotel_name}</li>`;
        });
    };

    // Initialize data
    fetchClients();
    fetchHotels();
    fetchBookings();

    // Handle client form submission
    clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(clientForm);
        const data = Object.fromEntries(formData);
        data.contact = data.contacts; // Match backend field
        delete data.contacts;
        try {
            await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            clientForm.reset();
            fetchClients();
        } catch (err) {
            alert('Ошибка при добавлении клиента');
        }
    });

    // Handle hotel form submission
    hotelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(hotelForm);
        const data = Object.fromEntries(formData);
        data.free_rooms = parseInt(data.free_rooms); // Match backend field
        try {
            await fetch('/api/hotels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            hotelForm.reset();
            fetchHotels();
        } catch (err) {
            alert('Ошибка при добавлении отеля');
        }
    });

    // Handle booking form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData);
        data.rooms_booked = parseInt(data.rooms_booked);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            bookingForm.reset();
            fetchHotels();
            fetchBookings();
        } catch (err) {
            alert(`Ошибка при бронировании: ${err.message}`);
        }
    });
});