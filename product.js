
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: DataTypes.STRING,
    price: DataTypes.FLOAT,
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    image: DataTypes.STRING,
    rating: DataTypes.JSON,
    sold: DataTypes.BOOLEAN, // Add a field to track if the product is sold or not
    soldDate: DataTypes.DATE, // Add a field to track the sale date
  }, {});
  return Product;
};
