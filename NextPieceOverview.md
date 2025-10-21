✦ Based on the research, the official Tetris Guideline allows for up to six "next"         
  pieces to be displayed. Modern competitive games typically show between 3 and 6
  pieces. This gives players enough information to plan several moves ahead.

  For this project, I recommend we implement a 3-piece "next" queue. This is a
  common and effective number that provides significant strategic depth without
  cluttering the UI. It's a great starting point, and we can always make it
  configurable later if desired.

  Here's the high-level plan to implement this:

   1. Engine Logic: Update the TetrisEngine to keep track of the next 3 pieces in
      the queue and include this information in the game Snapshot.
   2. UI Elements: Add three small <canvas> elements to index.html to serve as the
      display areas for the next pieces.
   3. Renderer Logic: Create a new function in the PixiRenderer to draw the pieces
      into these new canvases. This will involve creating separate, smaller PixiJS
      applications for each "next" piece display.
   4. Main Thread Orchestration: In main.ts, pass the "next" piece data from the
      snapshot to the renderer to be drawn.