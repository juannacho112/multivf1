// Fallback map data to use when the TMJ map file can't be loaded

export const fallbackMap = {
  width: 15,
  height: 20,
  tilewidth: 32,
  tileheight: 32,
  layers: [
    {
      id: 1,
      name: "Floor",
      type: "tilelayer",
      visible: true,
      width: 15,
      height: 20,
      data: Array(15 * 20).fill(0).map((_, i) => {
        // Create walls around the edges, floor tiles in the middle
        const x = i % 15;
        const y = Math.floor(i / 15);
        if (x === 0 || y === 0 || x === 14 || y === 19) {
          return 1; // Wall tile
        }
        return 2; // Floor tile
      })
    },
    {
      id: 2,
      name: "Furniture",
      type: "tilelayer",
      visible: true,
      width: 15,
      height: 20,
      data: Array(15 * 20).fill(0).map((_, i) => {
        // Add a table in the center
        const x = i % 15;
        const y = Math.floor(i / 15);
        if (x === 7 && y === 8) {
          return 4; // Table tile
        }
        return 0; // Empty
      })
    },
    {
      id: 3,
      name: "collision",
      type: "tilelayer",
      visible: true,
      opacity: 0.3,
      width: 15,
      height: 20,
      data: Array(15 * 20).fill(0).map((_, i) => {
        // Collision on walls and table
        const x = i % 15;
        const y = Math.floor(i / 15);
        if (x === 0 || y === 0 || x === 14 || y === 19 || (x === 7 && y === 8)) {
          return 5; // Collision
        }
        return 0; // No collision
      })
    }
  ],
  nextlayerid: 5,
  nextobjectid: 3,
  tilesets: [
    {
      firstgid: 1,
      name: "Floors_only_32x32",
      tilecount: 6,
      tileheight: 32,
      tilewidth: 32
    },
    {
      firstgid: 7,
      name: "Modern_Office_32x32",
      tilecount: 96,
      tileheight: 32,
      tilewidth: 32
    }
  ],
  // Add interactive objects similar to the TMJ file
  objects: [
    {
      id: 1,
      name: "Battle_Table",
      type: "battle_trigger",
      x: 224,
      y: 256,
      width: 32,
      height: 32,
      properties: [
        {
          name: "dialog",
          value: "This looks like a table for card battles. Want to play?"
        },
        {
          name: "type",
          value: "battle_trigger"
        }
      ]
    },
    {
      id: 2,
      name: "Player_Start",
      x: 240,
      y: 416,
      width: 32,
      height: 32
    }
  ]
};
