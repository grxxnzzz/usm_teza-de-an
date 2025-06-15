const express = require('express');
const path = require('path');
const clientRoutes = require('./clientRoutes');
const hotelRoutes = require('./hotelRoutes');
const bookingRoutes = require('./bookingRoutes');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Подключение маршрутов
app.use(clientRoutes);
app.use(hotelRoutes);
app.use(bookingRoutes);

// Обслуживание HTML-файлов
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/delete', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'delete.html'));
});

// Обработка 404 ошибок
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});