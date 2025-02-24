import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Clock, Settings, Ticket } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Navbar = () => {
  const { user, logout } = useUser();

  // Add debug log
  useEffect(() => {
    if (user) {
      console.log('Navbar user state:', user);
    }
  }, [user]);

  // Add memo for user display name
  const displayName = React.useMemo(() => {
    if (!user?.name) return '';
    return user.name.split(' ')[0].toUpperCase();
  }, [user?.name]);

  return (
    <>
      <nav className="fixed w-full bg-black/80 backdrop-blur-md z-50 py-2 px-6 border-b border-blue-500/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Enhanced BLOX Logo */}
          <Link to="/" className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-10 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative font-['Orbitron'] text-2xl tracking-[0.3em] py-2 px-4">
              <span className="text-white">BL</span>
              <span className="relative">
                <span className="text-WHITE">O</span>
              </span>
              <span className="text-white">X</span>
              {/* Animated lines */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan"></div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan-reverse"></div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-6">
            {/* Show Times */}
            <Link 
              to="/marketplace" 
              className="px-3 py-1.5 rounded border border-blue-500/10 hover:border-blue-500/30 
                         text-blue-400 font-mono text-xs tracking-wide transition-all duration-300 
                         flex items-center space-x-2 hover:bg-blue-500/5 group"
            >
              <Clock className="w-3 h-3 opacity-70 group-hover:opacity-100" />
              <span className="transform group-hover:translate-x-0.5 transition-transform">MARKETPLACE</span>
            </Link>

            <Link
              to="/my-tickets"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Ticket size={20} />
              <span>My Tickets</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-4 animate-slide-up">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500/5 border border-blue-500/10">
                  {user.picture && (
                    <img 
                      src={user.picture} 
                      alt={user.name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-blue-400 font-mono text-xs">
                    HI, {displayName}!
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link 
                to="/account" 
                className="px-3 py-1.5 rounded bg-blue-500/5 border border-blue-500/10 
                         text-blue-400 font-mono text-xs tracking-wide hover:bg-blue-500/10 
                         transition-all duration-300 flex items-center space-x-2 group"
              >
                <User className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                <span className="transform group-hover:translate-x-0.5 transition-transform">
                  SIGN_IN
                </span>
              </Link>
            )}

            <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-500/10 
                             hover:border-blue-500/30 text-blue-400 transition-all duration-300 
                             hover:bg-blue-500/5">
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* New content below the navbar */}
      {user && (
        <div className="text-center mt-16">
          <p className="text-blue-400 mb-2">Welcome back, {user.name}!</p>
        </div>
      )}
    </>
  );
};

export default Navbar;