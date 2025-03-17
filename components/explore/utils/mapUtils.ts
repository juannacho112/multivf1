import { Direction } from '../contexts/ExploreContext';

// Types for interactive objects on the map
export interface MapObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'npc' | 'battle_trigger' | 'item' | 'door' | 'other';
  properties: {
    [key: string]: any; // For custom properties like dialog text, item data, etc.
  };
}

/**
 * Get the next position based on current position and direction
 */
export const getNextPosition = (
  currentX: number,
  currentY: number,
  direction: Direction,
  stepSize: number
): { x: number; y: number } => {
  switch (direction) {
    case 'up':
      return { x: currentX, y: currentY - stepSize };
    case 'down':
      return { x: currentX, y: currentY + stepSize };
    case 'left':
      return { x: currentX - stepSize, y: currentY };
    case 'right':
      return { x: currentX + stepSize, y: currentY };
    default:
      return { x: currentX, y: currentY };
  }
};

/**
 * Calculate the viewport position to keep the player centered
 */
export const calculateViewport = (
  playerX: number,
  playerY: number,
  screenWidth: number,
  screenHeight: number,
  mapWidth: number,
  mapHeight: number,
  controlsHeight: number = 0
): { x: number; y: number } => {
  // Calculate the center point of the viewport
  const viewportX = playerX - screenWidth / 2;
  const viewportY = playerY - (screenHeight - controlsHeight) / 2;
  
  // Constrain viewport to map bounds
  return {
    x: Math.max(0, Math.min(mapWidth - screenWidth, viewportX)),
    y: Math.max(0, Math.min(mapHeight - screenHeight + controlsHeight, viewportY)),
  };
};

/**
 * Check if player is colliding with a tile in the collision layer
 */
export const checkTileCollision = (
  playerX: number,
  playerY: number,
  tileWidth: number,
  tileHeight: number,
  collisionLayer: number[],
  mapWidth: number
): boolean => {
  // Get the player's bounds
  const playerBounds = {
    left: playerX + 4, // Adding padding to make collision less strict
    right: playerX + 28, // Player width - padding
    top: playerY + 4, // Adding padding to make collision less strict
    bottom: playerY + 28, // Player height - padding
  };
  
  // Convert player bounds to tile coordinates
  const tilesToCheck = [
    { x: Math.floor(playerBounds.left / tileWidth), y: Math.floor(playerBounds.top / tileHeight) }, // Top-left
    { x: Math.floor(playerBounds.right / tileWidth), y: Math.floor(playerBounds.top / tileHeight) }, // Top-right
    { x: Math.floor(playerBounds.left / tileWidth), y: Math.floor(playerBounds.bottom / tileHeight) }, // Bottom-left
    { x: Math.floor(playerBounds.right / tileWidth), y: Math.floor(playerBounds.bottom / tileHeight) }, // Bottom-right
  ];
  
  // Check if any of these tiles have collision
  for (const tile of tilesToCheck) {
    const tileIndex = tile.y * mapWidth + tile.x;
    
    // Check if tile index is within array bounds
    if (tileIndex >= 0 && tileIndex < collisionLayer.length) {
      // In most tile maps, a non-zero value indicates a collision tile
      if (collisionLayer[tileIndex] !== 0) {
        return true; // Collision detected
      }
    }
  }
  
  return false; // No collision
};

/**
 * Find an interactive object near the player
 */
export const findNearbyObject = (
  playerX: number,
  playerY: number,
  objects: MapObject[],
  interactionRadius: number = 32 // Default interaction radius (pixels)
): MapObject | null => {
  // Define player center
  const playerCenterX = playerX + 16; // Assuming player is 32x32
  const playerCenterY = playerY + 16;
  
  for (const obj of objects) {
    // Calculate center of the object
    const objCenterX = obj.x + (obj.width / 2);
    const objCenterY = obj.y + (obj.height / 2);
    
    // Calculate distance between player and object centers
    const distance = Math.sqrt(
      Math.pow(playerCenterX - objCenterX, 2) + 
      Math.pow(playerCenterY - objCenterY, 2)
    );
    
    if (distance <= interactionRadius) {
      return obj; // Return the first object within interaction radius
    }
  }
  
  return null; // No nearby objects
};

/**
 * Check if point is inside a rectangle
 */
export const isPointInRect = (
  pointX: number,
  pointY: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  return (
    pointX >= rectX &&
    pointX <= rectX + rectWidth &&
    pointY >= rectY &&
    pointY <= rectY + rectHeight
  );
};

/**
 * Process map data to find interactive objects
 * This would parse object layers from the Tiled map
 */
export const processMapObjects = (mapData: any): MapObject[] => {
  const objects: MapObject[] = [];
  
  // Find object layers
  const objectLayers = mapData.layers.filter((layer: any) => layer.type === 'objectgroup');
  
  // Process each object layer
  for (const layer of objectLayers) {
    for (const obj of layer.objects) {
      // Extract properties from the object
      const properties: { [key: string]: any } = {};
      
      // Process custom properties if they exist
      if (obj.properties) {
        for (const prop of obj.properties) {
          properties[prop.name] = prop.value;
        }
      }
      
      // Determine object type
      let type: 'npc' | 'battle_trigger' | 'item' | 'door' | 'other' = 'other';
      
      if (properties.type) {
        // If type is explicitly set in properties
        type = properties.type as any;
      } else if (obj.type) {
        // If type is set in the object itself
        type = obj.type as any;
      } else if (properties.isNpc || obj.name.toLowerCase().includes('npc')) {
        type = 'npc';
      } else if (properties.isBattleTrigger || obj.name.toLowerCase().includes('battle')) {
        type = 'battle_trigger';
      } else if (properties.isItem || obj.name.toLowerCase().includes('item')) {
        type = 'item';
      } else if (properties.isDoor || obj.name.toLowerCase().includes('door')) {
        type = 'door';
      }
      
      // Create the map object
      const mapObject: MapObject = {
        id: obj.id.toString(),
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        type,
        properties: {
          ...properties,
          name: obj.name || properties.name || 'Unknown',
        },
      };
      
      objects.push(mapObject);
    }
  }
  
  return objects;
};
