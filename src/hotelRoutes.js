const express = require('express');
const { run, all, get } = require('./db');

const router = express.Router();

router.post('/api/hotels', async (req, res) => {
  const { name, location, free_rooms } = req.body;
  if (!name || !location || free_rooms < 0) {
    return res.status(400).json({ error: 'Название, локация и неотрицательное число свободных мест обязательно!' });
  }
  try {
    const result = await run('INSERT INTO Hotels (name, location, free_rooms) VALUES (?, ?, ?)', [name, location, free_rooms]);
    res.json({ id: result.lastID, name, location, free_rooms });
  } catch (err) {
    console.error('Ошибка при добавлении отеля:', err);
    res.status(500).json({ error: 'Не удалось добавить отель' });
  }
});

router.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await all('SELECT * FROM Hotels');
    res.json(hotels);
  } catch (err) {
    console.error('Ошибка при получении отелей:', err);
    res.status(500).json({ error: 'Не удалось получить отели' });
  }
});

router.delete('/api/hotels/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID отеля' });
  }
  try {
    const count = await get('SELECT COUNT(*) as count FROM Bookings WHERE hotel_id = ?', [id]);
    if (count.count > 0) {
      return res.status(400).json({ error: 'Нельзя удалить отель с имеющимися резервациями' });
    }
    const result = await run('DELETE FROM Hotels WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Отель не найден' });
    }
    res.json({ message: 'Отель успешно удален' });
  } catch (err) {
    console.error('Ошибвка в удалении отеля:', err);
    res.status(500).json({ error: 'Не удалось удалить отель' });
  }
});

module.exports = router;