import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BoardPage from './pages/BoardPage';
import './styles/App.css';
import './styles/BoardPage.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:id" element={<BoardPage />} />
      </Routes>
    </Router>
  );
}

export default App;