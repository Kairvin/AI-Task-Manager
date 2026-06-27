import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { ProtectedRoute } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AIChatPanel from './components/AIChatPanel';
import TaskModal from './components/TaskModal';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import TeamSettings from './pages/TeamSettings';
import Join from './pages/Join';
import Profile from './pages/Profile';

export default function App() {
  const { addTask, updateTask } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleNewTask = (initialData = null) => {
    // Prevent React MouseEvents from being treated as initialData
    const data = (initialData && !initialData.nativeEvent) ? initialData : null;
    setEditingTask(data);
    setModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask && editingTask.id) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/join" element={<Join />} />

      {/* Protected App Pages */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-layout">
              <Sidebar onNewTask={handleNewTask} />

              <div className="main-content">
                <TopBar onNewTask={handleNewTask} />

                <Routes>
                  <Route path="/dashboard" element={<Dashboard onEditTask={handleEditTask} />} />
                  <Route path="/tasks" element={<Tasks onEditTask={handleEditTask} onNewTask={handleNewTask} />} />
                  <Route path="/calendar" element={<Calendar onEditTask={handleEditTask} onNewTask={handleNewTask} />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/team-settings" element={<TeamSettings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>

              <AIChatPanel />

              {modalOpen && (
                <TaskModal
                  task={editingTask}
                  isNew={editingTask && !editingTask.id} // Help differentiate between edit and new with prefilled data
                  onClose={() => { setModalOpen(false); setEditingTask(null); }}
                  onSave={handleSaveTask}
                />
              )}
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
