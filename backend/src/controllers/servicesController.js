const db = require('../config/db');

const getAllServices = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM services ORDER BY category ASC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

const createService = async (req, res) => {
  const { name, category, duration_minutes, price } = req.body;
  if (!name || !category || !duration_minutes || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO services (name, category, duration_minutes, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category, duration_minutes, price]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, category, duration_minutes, price } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE services SET name = $1, category = $2, duration_minutes = $3, price = $4 WHERE id = $5 RETURNING *',
      [name, category, duration_minutes, price, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM services WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService
};
