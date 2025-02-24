import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Homepage from './components/Homepage';
import Menu from './components/Menu';
import AboutPage from './components/AboutPage';
import Marketplace from './components/Marketplace';


import Navbar from './components/Navbar';

import { UserProvider } from './context/UserContext';
import MyTickets from './components/MyTickets';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-black text-white">
    <Navbar /> {/* Navbar will be fixed at the top */}

    <div className="pt-24">
      {children}
    </div>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId="116642069385-kkedj8gb5h3q1731eep1eeo53qo9q8fd.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout><Homepage /></Layout>} />
            <Route path="/menu/:restaurantId" element={<Layout><Menu /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/my-tickets" element={<Layout><MyTickets /></Layout>} />
            <Route path="/marketplace" element={<Layout><Marketplace /></Layout>} />

          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;