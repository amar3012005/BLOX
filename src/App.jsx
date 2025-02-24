import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './components/Homepage';
import Menu from './components/Menu';
import AboutPage from './components/AboutPage';
import UnderProgress from './components/UnderProgress';
import MyTickets from './components/MyTickets';
import Navbar from './components/Navbar';
import Checkout from './components/Checkout';
import WaitingRoom from './components/WaitingRoom';
import PersonalInfo from './components/PersonalInfo';
import FuturisticOrderConfirmation from './components/FuturisticOrderConfirmation';
import Terms from './components/Terms';
import OfferMenu from './components/OfferMenu';
import { UserProvider } from './context/UserContext';
import { TicketsProvider } from './context/TicketsContext';
import Marketplace from './components/Marketplace';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-black text-white relative">
    <Navbar />
    <main className="pt-20 relative"> {/* Increased padding-top and added relative positioning */}
      {children}
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <UserProvider>
        <TicketsProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/menu/:restaurantId" element={<Menu />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/personal-info" element={<PersonalInfo />} />
              <Route path="/waiting-room" element={<WaitingRoom />} />
              <Route path="/order-confirmation" element={<FuturisticOrderConfirmation />} />
              <Route path="/underprogress" element={<UnderProgress />} />
              <Route path="/offer-menu" element={<OfferMenu />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/marketplace" element={<Marketplace />} />
            </Routes>
          </Layout>
        </TicketsProvider>
      </UserProvider>
    </Router>
  );
}

export default App;