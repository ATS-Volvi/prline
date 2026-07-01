import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ShiftPlanner } from './components/ShiftPlanner';
import { Analytics } from './components/Analytics';
import { MasterData } from './components/MasterData';
import { AuditLogs } from './components/AuditLogs';
import { Login } from './components/Login';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { PlantMap } from './components/PlantMap';

function MainAppContent() {
  const { token, logout } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedLineId, setSelectedLineId] = useState<string>('LINE-01');

  // Inactivity timeout: 30 minutes (1800000 ms)
  useEffect(() => {
    if (!token) return;

    let timeoutId: number;

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        alert("Session expired due to inactivity on plant-floor tablet.");
        logout();
      }, 1800000);
    };

    // Activity event listeners
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Initialize

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token, logout]);

  if (!token) {
    return <Login />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedLineId={setSelectedLineId} 
          />
        );
      case 'executive':
        return <ExecutiveDashboard setActiveTab={setActiveTab} />;
      case 'plant_map':
        return <PlantMap setActiveTab={setActiveTab} setSelectedLineId={setSelectedLineId} />;
      case 'shift_planner':
        return (
          <ShiftPlanner 
            selectedLineId={selectedLineId} 
            setSelectedLineId={setSelectedLineId} 
            setActiveTab={setActiveTab}
          />
        );
      case 'lines':
        return <MasterData initialSubTab="lines" setSelectedLineId={setSelectedLineId} setActiveTab={setActiveTab} />;
      case 'associates':
        return <MasterData initialSubTab="associates" setSelectedLineId={setSelectedLineId} setActiveTab={setActiveTab} />;
      case 'workstations':
        return <MasterData initialSubTab="workstations" setSelectedLineId={setSelectedLineId} setActiveTab={setActiveTab} />;
      case 'skills':
        return <MasterData initialSubTab="skills" setSelectedLineId={setSelectedLineId} setActiveTab={setActiveTab} />;
      case 'analytics':
        return <Analytics />;
      case 'audit_logs':
        return <AuditLogs />;
      default:
        return <Dashboard setActiveTab={setActiveTab} setSelectedLineId={setSelectedLineId} />;
    }
  };

  return (
    <div className="app-root flex w-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Active Screen Viewport */}
      <main className="flex-1 h-full flex flex-col overflow-hidden bg-background">
        {renderActiveTab()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
