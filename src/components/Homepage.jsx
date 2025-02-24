import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Ticket, User, MapPin, Users, Music } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { GoogleLogin } from '@react-oauth/google';
import { handleGoogleLogin } from '../services/authService';

const Homepage = () => {
  const { user, setUser } = useUser(); // Get user from context
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  
  // Concert data
  const concerts = [
    {
      id: 1,
      venue: "LONDON",
      date: "2025-06-15",
      time: "19:30",
      available: 500,
      price: "£150",
      status: "BOOKING",
    },
    {
      id: 2,
      venue: "NEW_YORK",
      date: "2025-07-20",
      time: "20:00",
      available: 750,
      price: "$200",
      status: "UPCOMING",
    },
    {
      id: 3,
      venue: "TOKYO",
      date: "2025-08-10",
      time: "18:30",
      available: 600,
      price: "¥25000",
      status: "UPCOMING",
    }
  ];

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Check for existing session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [setUser]);

  const handleShowSelect = (venue) => {
    if (!user) {
      // Instead of alert, scroll to the login button
      document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/about', { state: { venue } });
  };

  const onGoogleSuccess = async (credentialResponse) => {
    try {
      const userData = await handleGoogleLogin(credentialResponse);
      setUser(userData);
      // Save user data to localStorage for session persistence
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  const onGoogleError = () => {
    console.error("Google Sign In Failed");
    alert("Sign-in failed. Please try again.");
  };

  return (
    <div className="relative">
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background grid overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,#111_1px,transparent_1px),linear-gradient(-45deg,#111_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 space-y-16 w-full">
          {/* Updated Main Title positioning */}
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} -mt-52`}>
            <div className="text-center space-y-12">
              {/* Enhanced BLOX Logo */}
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                <h1 className="relative font-['Orbitron'] text-[8rem] font-bold tracking-[0.2em] leading-none">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-white animate-shine">
                    BLOX
                  </span>
                  {/* Glitch effect overlay */}
                 
                </h1>
              </div>
              
              {/* Concert Title with increased spacing */}
              <div className="mt-10">
                <h2 className="font-['Share_Tech_Mono'] text-4xl font-bold tracking-widest">
                  COLDPLAY<span className="text-red-500 animate-pulse">_LIVE</span>
                </h2>
                <div className="font-['Share_Tech_Mono'] text-blue-400 text-sm tracking-[0.5em] mt-2 animate-fade-in-up">
                  WORLD_TOUR_2025
                </div>
              </div>
            </div>
          </div>

          {/* Updated Concert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {concerts.map((concert) => (
              <div 
                key={concert.id}
                onClick={() => handleShowSelect(concert.venue)}
                className="group relative bg-black/60 border border-blue-500/20 rounded-lg 
                         overflow-hidden cursor-pointer hover:border-blue-500/40 
                         transition-all duration-500"
              >
                {/* Abstract Background Pattern */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20" />
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,#111_1px,transparent_1px),linear-gradient(-45deg,#111_1px,transparent_1px)] bg-[size:20px_20px]" />
                </div>

                {/* Content */}
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-lg font-bold">{concert.venue}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      concert.status === 'BOOKING' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {concert.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(concert.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Available: {concert.available}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <Ticket className="w-4 h-4" />
                      <span>From {concert.price}</span>
                    </div>
                  </div>

                  <button className="w-full py-2 mt-4 bg-blue-500/10 border border-blue-500/20 
                                   hover:bg-blue-500/20 text-blue-400 text-sm rounded
                                   transition-all duration-300">
                    SELECT VENUE →
                  </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-blue-500/30" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue-500/30" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue-500/30" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-blue-500/30" />
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="fixed bottom-28 left-0 right-0 bg-black/90 border-t border-blue-500/20 p-4">
            <div className="max-w-6xl mx-auto flex justify-between text-xs text-blue-500">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>TOTAL_VENUES: {concerts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>TOTAL_CAPACITY: {concerts.reduce((sum, c) => sum + c.available, 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>TOUR_DATES: 2025</span>
              </div>
            </div>
          </div>

          {/* Login Section */}
          <div id="login-section" className="fixed bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black via-black/95 to-transparent">
            {user ? (
              <div className="text-center">
                <p className="text-blue-400 mb-2">Welcome back, {user.name}!</p>
                <p className="text-gray-400 text-sm">Select a venue above to continue</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4 text-gray-400">Sign in to book tickets</div>
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={() => {}}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                  text="signin_with"
                  size="large"
                  locale="en"
                  auto_select={true}
                  render={({ onClick }) => (
                    <button
                      onClick={onClick}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                               text-white font-bold rounded-full hover:from-blue-600 
                               hover:to-blue-700 transition-all duration-300 
                               shadow-lg hover:shadow-blue-500/25"
                    >
                      BOOK NOW
                    </button>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
