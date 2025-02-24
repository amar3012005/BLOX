// Define the grid size
const ROWS = 120;
const COLS = 50;
const CELL_SIZE = 10; // Made cells smaller for more detailed pattern

// Cyberpunk color palette
const COLOR_MAP = {
  0: [0, 4, 15],     // Deep Black
  1: [3, 37, 65],    // Dark Blue
  2: [8, 61, 119],   // Medium Blue
  3: [0, 194, 255],  // Neon Blue
  4: [66, 245, 255], // Cyan
  5: [4, 17, 36],    // Navy Black
  6: [0, 24, 55],    // Dark Navy
  7: [0, 89, 179],   // Electric Blue
  8: [45, 149, 237], // Bright Blue
  9: [0, 42, 87]     // Midnight Blue
};

export const generateTicketBackground = (seatId) => {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#000408';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create deterministic random number generator
  let seed = seatId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Generate grid with glow effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(0, 149, 255, 0.5)';

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const value = Math.floor(random() * 10);
      const color = COLOR_MAP[value];
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${random() * 0.9 + 0.1})`;
      
      // Add variation to cell shapes
      if (random() > 0.97) {
        // Occasionally draw larger cells for variety
        ctx.fillRect(
          col * CELL_SIZE - 2, 
          row * CELL_SIZE - 2, 
          CELL_SIZE + 4, 
          CELL_SIZE + 4
        );
      } else {
        ctx.fillRect(
          col * CELL_SIZE, 
          row * CELL_SIZE, 
          CELL_SIZE - 1, 
          CELL_SIZE - 1
        );
      }
    }
  }

  // Add subtle scan lines
  ctx.fillStyle = 'rgba(0, 149, 255, 0.03)';
  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillRect(0, y, canvas.width, 1);
  }

  return canvas.toDataURL('image/png');
};
