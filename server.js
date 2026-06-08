const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      size TEXT,
      condition TEXT,
      tag TEXT,
      description TEXT,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function sanitizeImageSrc(src) {
  if (typeof src !== 'string' || !src.trim()) return false;
  const value = src.trim();
  if (value.startsWith('data:')) {
    const payload = value.split(',')[1] || '';
    return payload.trim().length > 0;
  }
  return value.startsWith('http://') || value.startsWith('https://');
}

function sanitizeImages(images) {
  return (images || []).filter(sanitizeImageSrc);
}

function cleanProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    size: row.size,
    condition: row.condition,
    tag: row.tag,
    desc: row.description,
    images: sanitizeImages(JSON.parse(row.images || '[]'))
  };
}

// ==================== API ENDPOINTS ====================

// GET all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const products = rows.map(row => cleanProductRow(row));
    res.json(products);
  });
});

// GET single product by ID
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(cleanProductRow(row));
  });
});

// POST - Create new product
app.post('/api/products', (req, res) => {
  const { name, price, category, size, condition, tag, desc, images } = req.body;
  
  if (!name || !price || !category) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const validImages = sanitizeImages(images);
  const imagesJson = JSON.stringify(validImages);
  
  db.run(
    'INSERT INTO products (name, price, category, size, condition, tag, description, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, price, category, size, condition, tag, desc, imagesJson],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        name,
        price,
        category,
        size,
        condition,
        tag,
        desc,
        images: images || []
      });
    }
  );
});

// PUT - Update product by ID
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, category, size, condition, tag, desc, images } = req.body;

  const validImages = sanitizeImages(images);
  const imagesJson = JSON.stringify(validImages);

  db.run(
    'UPDATE products SET name = ?, price = ?, category = ?, size = ?, condition = ?, tag = ?, description = ?, images = ? WHERE id = ?',
    [name, price, category, size, condition, tag, desc, imagesJson, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json({
        id: parseInt(id),
        name,
        price,
        category,
        size,
        condition,
        tag,
        desc,
        images: images || []
      });
    }
  );
});

// DELETE - Remove product by ID
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// DELETE all products (for testing)
app.delete('/api/products', (req, res) => {
  db.run('DELETE FROM products', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `Deleted ${this.changes} products` });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Veefits backend running at http://localhost:${PORT}`);
  console.log(`✓ API available at http://localhost:${PORT}/api/products`);
  console.log(`✓ Static files served from http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('\n✓ Database connection closed');
    process.exit(0);
  });
});
