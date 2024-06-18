const axios = require('axios');
const { Product } = require('./models');

const fetchAndSeed = async () => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const products = response.data;

    for (const product of products) {
      await Product.create({
        ...product,
        sold: product.sold ? true : false, // Assuming product has sold field
        soldDate: product.soldDate ? new Date(product.soldDate) : null, // Assuming product has soldDate field
      });
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = fetchAndSeed;

