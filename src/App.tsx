import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InspectionDetail from './pages/InspectionDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspection/:id" element={<InspectionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
