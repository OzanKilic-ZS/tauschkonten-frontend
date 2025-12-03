// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import KundeDetails from './components/KundeDetails';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/custtransaction/:customer2CaseANdTypeId/" element={<KundeDetails />} />
      </Routes>
    </Router>
  );
}
