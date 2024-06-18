import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    const response = await axios.get('http://localhost:3000/products', {
      params: { page, per_page: perPage, search }
    });
    setProducts(response.data.data);
    setTotalPages(response.data.total_pages);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, perPage, search]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1); // Reset to first page on new search
  };

  return (
    <div>
      <h1>Product List</h1>
      <input
        type="text"
        placeholder="Search"s
        value={search}
        onChange={handleSearchChange}
      />
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>
          </li>
        ))}
      </ul>
      <div>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span> Page {page} of {totalPages} </span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default App;
