const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server werkt!');
});

// voorbeeld: users ophalen
app.get('/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(rows);
  });
});

// voorbeeld: user toevoegen
app.post('/users', (req, res) => {
  const { username, password, role } = req.body;

  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, password, role],
    function(err) {
      if (err) {
        return res.status(500).send(err);
      }
      res.send("User toegevoegd!");
    }
  );
});

app.listen(3000, () => {
  console.log('Server draait op http://localhost:3000');
});
