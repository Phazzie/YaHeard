/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00ffff',
          pink: '#ff0080', 
          purple: '#8b00ff',
          green: '#00ff41',
          yellow: '#ffff00',
          orange: '#ff8000',
        },
        electric: {
          blue: '#0066ff',
          purple: '#6600cc',
          pink: '#cc0066',
        }
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'rainbow-shift': 'rainbow-shift 3s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out',
        'slide-in-left': 'slide-in-left 0.6s ease-out',
        'slide-in-right': 'slide-in-right 0.6s ease-out',
        'neon-flicker': 'neon-flicker 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { 
            boxShadow: '0 0 20px rgb(59, 130, 246), 0 0 40px rgb(59, 130, 246), 0 0 60px rgb(59, 130, 246)',
            textShadow: '0 0 10px rgb(59, 130, 246), 0 0 20px rgb(59, 130, 246), 0 0 30px rgb(59, 130, 246)'
          },
          '100%': { 
            boxShadow: '0 0 30px rgb(168, 85, 247), 0 0 60px rgb(168, 85, 247), 0 0 90px rgb(168, 85, 247)',
            textShadow: '0 0 15px rgb(168, 85, 247), 0 0 30px rgb(168, 85, 247), 0 0 45px rgb(168, 85, 247)'
          }
        },
        'rainbow-shift': {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'neon-flicker': {
          '0%, 100%': { 
            opacity: '1',
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor'
          },
          '50%': { 
            opacity: '0.8',
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor'
          }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgb(0, 255, 255), 0 0 40px rgb(0, 255, 255)',
        'neon-pink': '0 0 20px rgb(255, 0, 128), 0 0 40px rgb(255, 0, 128)', 
        'neon-purple': '0 0 20px rgb(139, 0, 255), 0 0 40px rgb(139, 0, 255)',
        'neon-green': '0 0 20px rgb(0, 255, 65), 0 0 40px rgb(0, 255, 65)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}