const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Serve static files from the public directory (relative to server.js location)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// SQLite Database Setup
const db = new sqlite3.Database(path.join(__dirname, '..', 'hotel.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS Clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        free_rooms INTEGER NOT NULL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS Bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        hotel_id INTEGER,
        rooms_booked INTEGER NOT NULL,
        FOREIGN KEY (client_id) REFERENCES Clients(id),
        FOREIGN KEY (hotel_id) REFERENCES Hotels(id)
      )
    `);
  }
});

// API Endpoints

// Clients
app.post('/api/clients', (req, res) => {
  const { name, contact } = req.body;
  if (!name || !contact) {
    return res.status(400).json({ error: 'Name and contact are required' });
  }
  db.run('INSERT INTO Clients (name, contact) VALUES (?, ?)', [name, contact], function(err) {
    if (err) {
      console.error('Error inserting client:', err.message);
      return res.status(500).json({ error: 'Failed to add client' });
    }
    res.json({ id: this.lastID, name, contact });
  });
});

app.get('/api/clients', (req, res) => {
  db.all('SELECT * FROM Clients', [], (err, rows) => {
    if (err) {
      console.error('Error fetching clients:', err.message);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
    res.json(rows);
  });
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }
  db.get('SELECT COUNT(*) as count FROM Bookings WHERE client_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking client bookings:', err.message);
      return res.status(500).json({ error: 'Failed to check bookings' });
    }
    if (row.count > 0) {
      return res.status(400).json({ error: 'Cannot delete client with existing bookings' });
    }
    db.run('DELETE FROM Clients WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting client:', err.message);
        return res.status(500).json({ error: 'Failed to delete client' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json({ message: 'Client deleted successfully' });
    });
  });
});

// Hotels
app.post('/api/hotels', (req, res) => {
  const { name, location, free_rooms } = req.body;
  if (!name || !location || free_rooms < 0) {
    return res.status(400).json({ error: 'Name, location, and non-negative free rooms are required' });
  }
  db.run('INSERT INTO Hotels (name, location, free_rooms) VALUES (?, ?, ?)', [name, location, free_rooms], function(err) {
    if (err) {
      console.error('Error inserting hotel:', err.message);
      return res.status(500).json({ error: 'Failed to add hotel' });
    }
    res.json({ id: this.lastID, name, location, free_rooms });
  });
});

app.get('/api/hotels', (req, res) => {
  db.all('SELECT * FROM Hotels', [], (err, rows) => {
    if (err) {
      console.error('Error fetching hotels:', err.message);
      return res.status(500).json({ error: 'Failed to fetch hotels' });
    }
    res.json(rows);
  });
});

app.delete('/api/hotels/:id', (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid hotel ID' });
  }
  db.get('SELECT COUNT(*) as count FROM Bookings WHERE hotel_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error checking hotel bookings:', err.message);
      return res.status(500).json({ error: 'Failed to check bookings' });
    }
    if (row.count > 0) {
      return res.status(400).json({ error: 'Cannot delete hotel with existing bookings' });
    }
    db.run('DELETE FROM Hotels WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting hotel:', err.message);
        return res.status(500).json({ error: 'Failed to delete hotel' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      res.json({ message: 'Hotel deleted successfully' });
    });
  });
});

// Bookings
app.post('/api/bookings', (req, res) => {
  const { client_id, hotel_id, rooms_booked } = req.body;
  if (!client_id || !hotel_id || rooms_booked <= 0) {
    return res.status(400).json({ error: 'Client ID, Hotel ID, and positive rooms booked are required' });
  }
  db.get('SELECT free_rooms FROM Hotels WHERE id = ?', [hotel_id], (err, row) => {
    if (err) {
      console.error('Error checking hotel availability:', err.message);
      return res.status(500).json({ error: 'Failed to check availability' });
    }
    if (!row || row.free_rooms < rooms_booked) {
      return res.status(400).json({ error: 'Not enough free rooms' });
    }
    db.run('UPDATE Hotels SET free_rooms = free_rooms - ? WHERE id = ?', [rooms_booked, hotel_id], (err) => {
      if (err) {
        console.error('Error updating hotel rooms:', err.message);
        return res.status(500).json({ error: 'Failed to update hotel' });
      }
      db.run('INSERT INTO Bookings (client_id, hotel_id, rooms_booked) VALUES (?, ?, ?)', [client_id, hotel_id, rooms_booked], function(err) {
        if (err) {
          console.error('Error creating booking:', err.message);
          return res.status(500).json({ error: 'Failed to create booking' });
        }
        res.json({ id: this.lastID, client_id, hotel_id, rooms_booked });
      });
    });
  });
});

app.get('/api/bookings', (req, res) => {
  db.all(`
    SELECT b.id, b.rooms_booked, c.name as client_name, h.name as hotel_name
    FROM Bookings b
    JOIN Clients c ON b.client_id = c.id
    JOIN Hotels h ON b.hotel_id = h.id
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching bookings:', err.message);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json(rows);
  });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/delete', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'delete.html'));
});

// Catch-all route for unmatched requests
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});