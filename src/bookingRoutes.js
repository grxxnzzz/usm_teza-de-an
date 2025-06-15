const express = require('express');
const { run, all, get } = require('./db');

const router = express.Router();

router.post('/api/bookings', async (req, res) => {
  const { client_id, hotel_id, rooms_booked } = req.body;
  if (!client_id || !hotel_id || rooms_booked <= 0) {
    return res.status(400).json({ error: 'ID клиента, ID отеля, и неотрицательное число броней обязательно!' });
  }
  try {
    const hotel = await get('SELECT free_rooms FROM Hotels WHERE id = ?', [hotel_id]);
    if (!hotel || hotel.free_rooms < rooms_booked) {
      return res.status(400).json({ error: 'Недостаточно свободных комнат' });
    }
    await run('UPDATE Hotels SET free_rooms = free_rooms - ? WHERE id = ?', [rooms_booked, hotel_id]);
    const result = await run('INSERT INTO Bookings (client_id, hotel_id, rooms_booked) VALUES (?, ?, ?)', [client_id, hotel_id, rooms_booked]);
    res.json({ id: result.lastID, client_id, hotel_id, rooms_booked });
  } catch (err) {
    console.error('Ошибка в бронировании:', err);
    res.status(500).json({ error: 'Не удалось забронировать' });
  }
});

router.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await all(`
      SELECT b.id, b.rooms_booked, c.name as client_name, h.name as hotel_name
      FROM Bookings b
      JOIN Clients c ON b.client_id = c.id
      JOIN Hotels h ON b.hotel_id = h.id
    `);
    res.json(bookings);
  } catch (err) {
    console.error('Ошибка в получении броней:', err);
    res.status(500).json({ error: 'Не удалось получить брони' });
  }
});

router.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID брони' });
  }
  try {
    const booking = await get('SELECT hotel_id, rooms_booked FROM Bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Бронь не найдена' });
    }
    await run('BEGIN TRANSACTION');
    try {
      await run('DELETE FROM Bookings WHERE id = ?', [id]);
      await run('UPDATE Hotels SET free_rooms = free_rooms + ? WHERE id = ?', [booking.rooms_booked, booking.hotel_id]);
      await run('COMMIT');
      res.json({ message: 'Бронь успешна отменена' });
    } catch (err) {
      await run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Ошибка в отмене бронирования:', err);
    res.status(500).json({ error: 'Не удалось отменить бронирование' });
  }
});

module.exports = router;