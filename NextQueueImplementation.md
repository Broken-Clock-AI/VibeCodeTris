 Objective: Display the upcoming tetrominoes in the #next-queue-container on the side
  panel.

  ---

  Implementation Steps

   1. Create a Dedicated Renderer for the "Next" Queue:
       * Just like we did for the "Hold" piece, we will create a new, separate
         PIXI.Application instance to manage the #next-canvas element.
       * This keeps the rendering logic clean and decoupled from the main game board.      

   2. Update `pixiRenderer.ts`:
       * Initialization: In the create method, initialize the new Pixi application and
         link it to the #next-canvas.
       * Drawing Logic: Create a new private method, drawNextQueue(snapshot), that will be
          called every time a new snapshot is received.
       * Render Loop: Inside drawNextQueue, the logic will:
           * Clear the "Next" canvas.
           * Loop through the nextTypes array provided in the snapshot data.
           * For each piece in the queue, draw its shape onto the canvas, stacking them
             vertically.
           * Ensure proper spacing and centering to make the queue clear and readable.
       * Resize Logic: Update the main resize method to also handle the scaling of the
         "Next" queue canvas, ensuring it fits correctly within its container.

   3. Final Adjustments (If Necessary):
       * Review the layout and styling in index.html to make sure the "Next" queue display
          is visually appealing and consistent with the rest of the UI.

  ---

  That's the entire process. The backend data is already available; we just need to
  create the logic to visualize it.