// pages/BoardPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../styles/BoardPage.css';

function Task({
  task,
  columnId,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  isDragging
}) {
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      className={`task-item ${task.completed ? 'completed' : ''}`}
      style={style}
      {...attributes}
    >
      <span {...listeners}>{task.name}</span>
      <div className="task-actions">
        <button onClick={(e) => { e.stopPropagation(); onEditTask(columnId, task.id); }}>✏️</button>
        <button onClick={(e) => { e.stopPropagation(); onDeleteTask(columnId, task.id); }}>🗑</button>
        <button onClick={(e) => { e.stopPropagation(); onToggleTask(columnId, task.id); }}>✅</button>
      </div>
    </li>
  );
}

function SortableTask(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.task.id });

  return <Task {...props} listeners={listeners} attributes={attributes} setNodeRef={setNodeRef} transform={transform} transition={transition} isDragging={isDragging} />;
}

function BoardPage() {
  const { id } = useParams();
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(null);
  const [columnName, setColumnName] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('boards')) || [];
    const found = saved.find(b => b.id === id);
    setBoards(saved);
    if (!found) navigate('/');
    else setBoard(found);
  }, [id, navigate]);

  const updateBoard = (updatedBoard) => {
    const updatedBoards = boards.map(b => (b.id === updatedBoard.id ? updatedBoard : b));
    setBoards(updatedBoards);
    setBoard(updatedBoard);
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const addColumn = () => {
    if (!columnName.trim()) return;
    const newCol = { id: uuidv4(), name: columnName, tasks: [] };
    updateBoard({ ...board, columns: [...board.columns, newCol] });
    setColumnName('');
  };

  const addTask = (colId, task) => {
  if (!task.name.trim()) {
    alert('Task name cannot be empty.');
    return;
  }
  const updated = board.columns.map(c =>
    c.id === colId ? { ...c, tasks: [...c.tasks, { ...task, id: uuidv4() }] } : c
  );
  updateBoard({ ...board, columns: updated });
};

  const onEditTask = (colId, taskId) => {
    const newName = prompt('New task name:');
    if (!newName) return;
    const updated = board.columns.map(c => {
      if (c.id !== colId) return c;
      return {
        ...c,
        tasks: c.tasks.map(t => t.id === taskId ? { ...t, name: newName } : t)
      };
    });
    updateBoard({ ...board, columns: updated });
  };

  const onDeleteTask = (colId, taskId) => {
  const updated = board.columns.map(c =>
    c.id === colId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
  );
  updateBoard({ ...board, columns: updated });
  };

  const onToggleTask = (colId, taskId) => {
    const updated = board.columns.map(c => {
      if (c.id !== colId) return c;
      return {
        ...c,
        tasks: c.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      };
    });
    updateBoard({ ...board, columns: updated });
  };

  const handleDragStart = ({ active }) => {
    const task = board.columns.flatMap(col => col.tasks).find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || !active || active.id === over.id) return;

    let sourceCol, targetCol, task;
    let sourceIndex, targetIndex;

    for (const col of board.columns) {
      const index = col.tasks.findIndex(t => t.id === active.id);
      if (index !== -1) {
        sourceCol = col;
        sourceIndex = index;
        task = col.tasks[index];
      }
    }

    for (const col of board.columns) {
      const index = col.tasks.findIndex(t => t.id === over.id);
      if (index !== -1) {
        targetCol = col;
        targetIndex = index;
      }
    }

    if (!sourceCol || !targetCol || !task) return;

    const newColumns = board.columns.map(col => {
      if (col.id === sourceCol.id && col.id === targetCol.id) {
        const reordered = arrayMove([...col.tasks], sourceIndex, targetIndex);
        return { ...col, tasks: reordered };
      } else if (col.id === sourceCol.id) {
        return { ...col, tasks: col.tasks.filter(t => t.id !== task.id) };
      } else if (col.id === targetCol.id) {
        return { ...col, tasks: [...col.tasks.slice(0, targetIndex), task, ...col.tasks.slice(targetIndex)] };
      }
      return col;
    });

    updateBoard({ ...board, columns: newColumns });
    setActiveTask(null);
  };

  if (!board) return <div>Loading...</div>;

  return (
    <div className="board-container">
      <h1 className="board-title">{board.name}</h1>
      <div className="board-input-group">
        <input
          value={columnName}
          onChange={e => setColumnName(e.target.value)}
          placeholder="New column name"
        />
        <button onClick={addColumn}>Add Column</button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="column-list">
          {board.columns.map(col => (
            <div className="column" key={col.id}>
              <h3>{col.name}</h3>
              <SortableContext
                id={col.id}
                items={col.tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="task-list">
                  {col.tasks.map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      columnId={col.id}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onToggleTask={onToggleTask}
                    />
                  ))}
                </ul>
              </SortableContext>
              <div className="add-task">
                <input
                  placeholder="New task"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTask(col.id, { name: e.target.value, completed: false });
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <div className="task-item dragging">🧩 {activeTask.name}</div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default BoardPage;
