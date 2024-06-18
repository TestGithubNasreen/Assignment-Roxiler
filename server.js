const express = require('express');
const { Op } = require('sequelize');
const axios = require('axios');
const { sequelize, Product } = require('./models');

const app = express();
app.use(express.json());

// Function to initialize the database
const initializeDatabase = async () => {
  await sequelize.sync({ force: true });
  const fetchAndSeed = require('./seed');
  await fetchAndSeed();
};

// Endpoint to get products with search and pagination
app.get('/products', async (req, res) => {
  const { page = 1, per_page = 10, search = '' } = req.query;
  const limit = parseInt(per_page, 10);
  const offset = (parseInt(page, 10) - 1) * limit;

  const whereCondition = search
    ? {
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { price: { [Op.eq]: parseFloat(search) } }
        ]
      }
    : {};

  try {
    const { count, rows } = await Product.findAndCountAll({
      where: whereCondition,
      limit,
      offset
    });

    res.json({
      total: count,
      page: parseInt(page, 10),
      per_page: limit,
      total_pages: Math.ceil(count / limit),
      data: rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get statistics for a selected month
app.get('/statistics', async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Month query parameter is required' });
  }

  try {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const totalSalesAmount = await Product.sum('price', {
      where: {
        sold: true,
        soldDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const totalSoldItems = await Product.count({
      where: {
        sold: true,
        soldDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const totalNotSoldItems = await Product.count({
      where: {
        sold: false,
        soldDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    res.json({
      totalSalesAmount,
      totalSoldItems,
      totalNotSoldItems
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get bar chart data
app.get('/barchart', async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Month query parameter is required' });
  }

  try {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const priceRanges = [
      { range: '0-100', min: 0, max: 100 },
      { range: '101-200', min: 101, max: 200 },
      { range: '201-300', min: 201, max: 300 },
      { range: '301-400', min: 301, max: 400 },
      { range: '401-500', min: 401, max: 500 },
      { range: '501-600', min: 501, max: 600 },
      { range: '601-700', min: 601, max: 700 },
      { range: '701-800', min: 701, max: 800 },
      { range: '801-900', min: 801, max: 900 },
      { range: '901-above', min: 901, max: Infinity }
    ];

    const results = {};

    for (const { range, min, max } of priceRanges) {
      results[range] = await Product.count({
        where: {
          price: { [Op.between]: [min, max] },
          soldDate: {
            [Op.between]: [startDate, endDate]
          }
        }
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching bar chart data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get pie chart data
app.get('/piechart', async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Month query parameter is required' });
  }

  try {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const categories = await Product.findAll({
      where: {
        soldDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['category', [sequelize.fn('COUNT', 'category'), 'count']],
      group: 'category'
    });

    const results = {};
    categories.forEach(category => {
      results[category.category] = category.dataValues.count;
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get combined data
app.get('/combined', async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Month query parameter is required' });
  }

  try {
    // Make concurrent requests to the other endpoints
    const [statistics, barChart, pieChart] = await Promise.all([
      axios.get(`http://localhost:3000/statistics?month=${month}`),
      axios.get(`http://localhost:3000/barchart?month=${month}`),
      axios.get(`http://localhost:3000/piechart?month=${month}`)
    ]);

    // Combine the responses
    const combinedData = {
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data
    };

    // Send the combined response
    res.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, async () => {
  console.log('Server is running on port 3000');
  await initializeDatabase();
});
