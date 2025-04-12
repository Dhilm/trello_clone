// pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import '../styles/Home.css';

function Home() {
  const [boards, setBoards] = useState([]);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('boards')) || [];
    setBoards(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('boards', JSON.stringify(boards));
  }, [boards]);

  const addBoard = () => {
    if (!name.trim()) return;
    const newBoard = { id: uuidv4(), name, columns: [] };
    setBoards([...boards, newBoard]);
    setName('');
  };

  const deleteBoard = (id) => {
    setBoards(boards.filter(board => board.id !== id));
  };

  const editBoard = (id) => {
    const newName = prompt('New board name:');
    if (!newName) return;
    setBoards(boards.map(b => (b.id === id ? { ...b, name: newName } : b)));
  };

  const goToBoard = (id) => {
    navigate(`/board/${id}`);
  };

  return (
    <div className="home-container">
      <h1 className="home-title">📋 My Boards</h1>
      <div className="home-input-group">
        <input
          type="text"
          placeholder="New board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addBoard}>Add Board</button>
      </div>

      <ul className="board-grid">
        {boards.map(board => (
          <li
            key={board.id}
            className="board-card"
            onClick={() => goToBoard(board.id)}
          >
            <div className="board-name">{board.name}</div>
            <div className="card-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editBoard(board.id);
                }}
              >✏️</button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBoard(board.id);
                }}
              >🗑</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
