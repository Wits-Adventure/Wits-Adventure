import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home.js';
import ProfilePage from './pages/ProfilePage.js';

function App() {
  return (
    <Router>
      <section className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </section>
    </Router>
  );
}

export default App;
