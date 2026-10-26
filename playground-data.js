// Playground content. x/y/w are positions on the 2400×1560 canvas tile (desktop);
// pw/ph are the media's pixel size, used for its aspect ratio. Items with `video`
// play muted on a loop instead of showing `src`.

window.PLAYGROUND = {
  canvas: { width: 2400, height: 1560 },

  items: [
    // Row 1
    { id: "cart", title: "The pipeline, basically.", description: "A shopping cart full of deployment sprawl, for ArcFlow",
      src: "assets/social-wall-00.jpg", pw: 1080, ph: 1350, x: 40, y: 30, w: 200, z: 3 },
    { id: "hoodie", title: "FuturixAI hoodie", description: "Merch, with “Intelligence in motion” on the back",
      src: "assets/hoodie-back.jpg", pw: 691, ph: 738, x: 560, y: 70, w: 230, z: 5 },
    { id: "dog", title: "Head of morale", description: "Also my most patient user tester",
      src: "assets/me-dog.jpg", pw: 1204, ph: 1600, x: 1010, y: 20, w: 210, z: 2 },
    { id: "cortex", title: "Cortex Labs deck", description: "Making enterprise AI operations tangible",
      src: "assets/ppt-collage-00.jpg", pw: 1383, ph: 778, x: 1460, y: 110, w: 320, z: 6 },
    { id: "origami", title: "Origami butterfly", description: "Paper, folded by hand",
      src: "assets/origami.jpg", pw: 899, ph: 1599, x: 1990, y: 40, w: 170, z: 1 },

    // Row 2
    { id: "eyeq", title: "EyeQ Glasses", description: "Line drawings for a FuturixAI product, in two colourways",
      src: "assets/eyeq-glasses.jpg", pw: 1078, ph: 1120, x: 150, y: 420, w: 250, z: 4 },
    { id: "puppy", title: "Puppy vs. plush", description: "The plush did not survive",
      src: "assets/me-dog.jpg", video: "assets/puppy.mp4", pw: 478, ph: 850, x: 640, y: 400, w: 180, z: 7 },
    { id: "zodiac", title: "Zodiac signs at work", description: "Twelve office personalities with corporate jobs",
      src: "assets/social-wall-03.jpg", pw: 1080, ph: 1350, x: 960, y: 450, w: 210, z: 3 },
    { id: "gd-head", title: "Graphic Design Head, 2025–26", description: "Deadlines inspire miracles",
      src: "assets/gd-head.jpg", pw: 1024, ph: 1280, x: 1380, y: 420, w: 210, z: 5 },
    { id: "fxai", title: "FxAI Decision Model", description: "Calibrated decisions over 255 options. I worked on the model at FuturixAI",
      src: "assets/fxai-decision-model.png", pw: 1080, ph: 1350, x: 1860, y: 450, w: 220, z: 2 },

    // Row 3
    { id: "tee", title: "TEDxNSUT tee", description: "Delhi in one line drawing, for the organising team",
      src: "assets/tee-tedx.jpg", pw: 583, ph: 819, x: 30, y: 800, w: 200, z: 6 },
    { id: "arcflow", title: "ArcFlow.ai deck", description: "A sky motif for the cost of broken workflows",
      src: "assets/ppt-collage-01.jpg", pw: 1383, ph: 778, x: 450, y: 860, w: 320, z: 1 },
    { id: "maggi", title: "Fuel", description: "Two-minute noodles, ten-minute breaks",
      src: "assets/me-maggi.jpg", pw: 1204, ph: 1600, x: 960, y: 790, w: 210, z: 4 },
    { id: "approved", title: "Getting a deploy approved", description: "…before the stakeholder changes their mind",
      src: "assets/social-wall-06.jpg", pw: 1080, ph: 1350, x: 1400, y: 800, w: 210, z: 7 },
    { id: "rangoli", title: "Diwali rangoli", description: "A peacock in colour and diyas",
      src: "assets/rangoli.jpg", pw: 1204, ph: 1600, x: 1900, y: 820, w: 200, z: 3 },

    // Row 4
    { id: "shoirs", title: "SHOIRS Studio", description: "A logo exploration with hand-drawn rings",
      src: "assets/shoirs-studio.jpg", pw: 616, ph: 501, x: 200, y: 1200, w: 260, z: 2 },
    { id: "rfp", title: "RFP Intelligence", description: "A typography-led editorial post",
      src: "assets/social-wall-07.jpg", pw: 1080, ph: 1350, x: 650, y: 1170, w: 200, z: 5 },
    { id: "mark", title: "Building the mark", description: "The FuturixAI logo on a golden-ratio grid",
      src: "assets/logo-grid.jpg", pw: 899, ph: 1599, x: 1090, y: 1160, w: 170, z: 1 },
    { id: "desktop", title: "DeskTop", description: "An offline-first file workspace with visible sync",
      src: "assets/desk-motion-0.jpg", pw: 1728, ph: 1229, x: 1450, y: 1220, w: 320, z: 6 },
    { id: "metro", title: "Between stops", description: "On the metro, on the way to the next thing",
      src: "assets/me-metro.jpg", pw: 899, ph: 1599, x: 2000, y: 1150, w: 170, z: 4 },
  ],

  // Phones (< 810px) get a plain vertical list of a curated subset.
  mobileOrder: [
    "dog", "cart", "hoodie", "puppy", "eyeq", "zodiac",
    "gd-head", "tee", "cortex", "maggi",
  ],
};
