import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InspectionDetail from './pages/InspectionDetail';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspection/:id" element={<InspectionDetail />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
