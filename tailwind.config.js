module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' }
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(2px, 2px)' },
          '50%': { transform: 'translate(-2px, -2px)' },
          '75%': { transform: 'translate(1px, -1px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glitch-2': {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-5px, 3px)' },
          '66%': { transform: 'translate(5px, -3px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.1' },
        }
      },
      animation: {
        'pulse': 'pulse 1.5s ease-in-out infinite',
        'slideIn': 'slideIn 0.5s ease-out forwards',
        'gradient-slow': 'gradient 8s linear infinite',
        'shimmer-slow': 'shimmer 4s linear infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee2': 'marquee2 25s linear infinite',
        'float-slow': 'float 3s ease-in-out infinite',
        'float-medium': 'float 2.5s ease-in-out infinite',
        'float-fast': 'float 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'scan-reverse': 'scan 2s linear infinite reverse',
        'shine': 'shine 6s linear infinite',
        'glitch': 'glitch 3s linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s linear infinite',
        'glitch-2': 'glitch-2 5s linear infinite',
        'pulse-slow': 'pulse-slow 4s linear infinite',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        'tech-mono': ['Share Tech Mono', 'monospace'],
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}

