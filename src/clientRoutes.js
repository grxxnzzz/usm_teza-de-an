const express = require('express');
const { run, all, get } = require('./db');

const router = express.Router();

router.post('/api/clients', async (req, res) => {
  const { name, contact } = req.body;
  if (!name || !contact) {
    return res.status(400).json({ error: 'Имя и контакты обязательны!' });
  }
  try {
    const result = await run('INSERT INTO Clients (name, contact) VALUES (?, ?)', [name, contact]);
    res.json({ id: result.lastID, name, contact });
  } catch (err) {
    console.error('Ошибка в добавлении клиента:', err);
    res.status(500).json({ error: 'Не удалось добавить клиента' });
  }
});

router.get('/api/clients', async (req, res) => {
  try {
    const clients = await all('SELECT * FROM Clients');
    res.json(clients);
  } catch (err) {
    console.error('Ошибка при получении клиентов:', err);
    res.status(500).json({ error: 'Не удалось получить клиентов' });
  }
});

router.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID клиента' });
  }
  try {
    const count = await get('SELECT COUNT(*) as count FROM Bookings WHERE client_id = ?', [id]);
    if (count.count > 0) {
      return res.status(400).json({ error: 'Невозможно удалить клиента с существующими резервациями.' });
    }
    const result = await run('DELETE FROM Clients WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }
    res.json({ message: 'Клиент успешно удален' });
  } catch (err) {
    console.error('Ошибка в удалении клиента:', err);
    res.status(500).json({ error: 'Не удалось удалить клиента' });
  }
});

module.exports = router;