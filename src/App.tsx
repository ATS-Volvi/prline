import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ShiftPlanner } from './components/ShiftPlanner';
import { SkillMatrix } from './components/SkillMatrix';
import { Analytics } from './components/Analytics';
import { MasterData } from './components/MasterData';
import { AiReports } from './components/AiReports';
import { AuditLogs } from './components/AuditLogs';
import { Login } from './components/Login';

function MainAppContent() {
  const { token } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedLineId, setSelectedLineId] = useState<string>('LINE-01');

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
      case 'shift_planner':
        return (
          <ShiftPlanner 
            selectedLineId={selectedLineId} 
            setSelectedLineId={setSelectedLineId} 
            setActiveTab={setActiveTab}
          />
        );
      case 'skill_matrix':
        return <SkillMatrix />;
      case 'analytics':
        return <Analytics />;
      case 'master_data':
        return <MasterData />;
      case 'ai_reports':
        return <AiReports />;
      case 'audit_logs':
        return <AuditLogs />;
      default:
        return <Dashboard setActiveTab={setActiveTab} setSelectedLineId={setSelectedLineId} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
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
