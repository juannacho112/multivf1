/**
 * Map loader utility that provides functions to load map data from various sources
 */

import { fallbackMap } from '../data/fallbackMap';

// Define the common interface for map data
export interface TmjMapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: any[];
  tilesets: {
    firstgid: number;
    name: string;
    tilecount?: number;
    tileheight?: number;
    tilewidth?: number;
  }[];
  [key: string]: any; // Allow other properties
}

// This is the officemain map data hardcoded as a constant
// We do this to avoid dynamic require which causes issues
export const officemainMapData: TmjMapData = {
  "compressionlevel": -1,
  "height": 20,
  "infinite": false,
  "layers": [
    {
      "data": [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
      ],
      "height": 20,
      "id": 1,
      "name": "Floor",
      "opacity": 1,
      "type": "tilelayer",
      "visible": true,
      "width": 15,
      "x": 0,
      "y": 0
    },
    {
      "data": [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ],
      "height": 20,
      "id": 2,
      "name": "Furniture",
      "opacity": 1,
      "type": "tilelayer",
      "visible": true,
      "width": 15,
      "x": 0,
      "y": 0
    },
    {
      "data": [
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5
      ],
      "height": 20,
      "id": 3,
      "name": "collision",
      "opacity": 0.3,
      "type": "tilelayer",
      "visible": true,
      "width": 15,
      "x": 0,
      "y": 0
    },
    {
      "draworder": "topdown",
      "id": 4,
      "name": "Objects",
      "objects": [
        {
          "height": 32,
          "id": 1,
          "name": "Battle_Table",
          "properties": [
            {
              "name": "dialog",
              "type": "string",
              "value": "This looks like a table for card battles. Want to play?"
            },
            {
              "name": "type",
              "type": "string",
              "value": "battle_trigger"
            }
          ],
          "rotation": 0,
          "type": "battle_trigger",
          "visible": true,
          "width": 32,
          "x": 224,
          "y": 256
        },
        {
          "height": 32,
          "id": 2,
          "name": "Player_Start",
          "properties": [],
          "rotation": 0,
          "type": "",
          "visible": true,
          "width": 32,
          "x": 240,
          "y": 416
        }
      ],
      "opacity": 1,
      "type": "objectgroup",
      "visible": true,
      "x": 0,
      "y": 0
    }
  ],
  "nextlayerid": 5,
  "nextobjectid": 3,
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "tiledversion": "1.10.1",
  "tileheight": 32,
  "tilesets": [
    {
      "firstgid": 1,
      "name": "Floors_only_32x32",
      "tilecount": 6,
      "tileheight": 32,
      "tilewidth": 32
    },
    {
      "firstgid": 7,
      "name": "Modern_Office_32x32",
      "tilecount": 96,
      "tileheight": 32,
      "tilewidth": 32
    }
  ],
  "tilewidth": 32,
  "type": "map",
  "version": "1.10",
  "width": 15
};

/**
 * Load map data from specified path
 */
export const loadMapData = async (mapPath: string): Promise<TmjMapData> => {
  try {
    // First try to load the map data from our pre-defined maps
    if (mapPath === 'json_tiled_Map_uploads/officemain.tmj') {
      // Use the officemainMapData constant defined above
      console.log('Successfully loaded the main map data');
      return {...officemainMapData}; // Return a copy to avoid mutations
    } else {
      // For any other map paths, we'll use the fallback
      console.warn(`Map path not recognized: ${mapPath}, using fallback`);
      return {...fallbackMap, _isFallback: true};
    }
  } catch (error) {
    console.error('Error loading map data:', error);
    console.warn('Using fallback map data');
    return {...fallbackMap, _isFallback: true};
  }
};

/**
 * Process object layers into interactive objects
 */
// Define interfaces for objects and properties
interface TmjMapObject {
  id: number;
  name?: string;
  type?: string;
  x: number;
  y: number;
  width: number; 
  height: number;
  properties?: TmjMapProperty[];
  [key: string]: any;
}

interface TmjMapProperty {
  name: string;
  type?: string;
  value: any;
}

interface TmjMapObjectLayer {
  type: string;
  objects?: TmjMapObject[];
  [key: string]: any;
}

interface InteractiveObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
}

export const processObjectLayers = (mapData: TmjMapData): InteractiveObject[] => {
  const interactiveObjects: InteractiveObject[] = [];
  
  // Find object layers
  const objectLayers = mapData.layers.filter(layer => layer.type === 'objectgroup');
  
  objectLayers.forEach((layer: TmjMapObjectLayer) => {
    if (layer.objects && Array.isArray(layer.objects)) {
      layer.objects.forEach((obj: TmjMapObject) => {
        // Only add objects with a type or name
        if (obj.type || obj.name) {
          const properties: Record<string, any> = {};
          
          // Convert properties array to object for easier access
          if (obj.properties && Array.isArray(obj.properties)) {
            obj.properties.forEach((prop: TmjMapProperty) => {
              properties[prop.name] = prop.value;
            });
          }
          
          interactiveObjects.push({
            id: obj.id,
            name: obj.name || 'unnamed',
            type: obj.type || (properties['type'] as string) || 'generic',
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            properties
          });
        }
      });
    }
  });
  
  return interactiveObjects;
};
