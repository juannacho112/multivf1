import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { tilesets, tilesetImages } from '../../../json_tiled_Map_uploads/Assets/tilesets';
import { loadMapData, processObjectLayers, TmjMapData } from '../utils/mapLoader';
import { useExplore } from '../contexts/ExploreContext';
import { findNearbyObject, checkTileCollision, calculateViewport } from '../utils/mapUtils';
import { PlayerSprite } from './PlayerSprite';

interface TilesetInfo {
  name: string;
  firstgid: number;
  source?: string;
  imageWidth: number;
  imageHeight: number;
  tileWidth: number;
  tileHeight: number;
  imageSource: any; // Image source for React Native
}

interface MapRendererProps {
  mapPath: string; // Path to the TMJ file (relative to project root)
  tilesetPaths: { [key: string]: any }; // Mapping of tileset names to image requires
}

export const MapRenderer: React.FC<MapRendererProps> = ({
  mapPath,
  tilesetPaths,
}) => {
  const { 
    state, 
    setMapData, 
    setNearbyObject,
    setViewport 
  } = useExplore();
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tilesets, setTilesets] = useState<TilesetInfo[]>([]);
  const [collisionData, setCollisionData] = useState<number[]>([]);
  const [localMapData, setLocalMapData] = useState<TmjMapData | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  
  const { player, map, ui } = state;
  
  // Load map data on component mount
  useEffect(() => {
    const loadMap = async () => {
      try {
        // Use our map loader utility to load the map data
        const mapJson = await loadMapData(mapPath);
        
        // Check if it's using fallback data
        if (mapJson._isFallback) {
          setUsedFallback(true);
        }
        
        setLocalMapData(mapJson);
        setMapData(mapJson);
        
        // Process tilesets
        const processedTilesets = mapJson.tilesets.map((tileset) => {
          // Get the tileset name
          const tilesetName = tileset.name;
          
          // Find the corresponding image in the provided paths
          const imageSource = tilesetPaths[tilesetName];
          
          if (!imageSource) {
            console.warn(`Tileset image not found for ${tilesetName}`);
          }
          
          return {
            name: tilesetName,
            firstgid: tileset.firstgid,
            // Use default values for image dimensions
            imageWidth: 192, // Default for Floors_only_32x32
            imageHeight: 32, // Default height
            tileWidth: tileset.tilewidth || mapJson.tilewidth,
            tileHeight: tileset.tileheight || mapJson.tileheight,
            imageSource,
          };
        });
        
        setTilesets(processedTilesets);
        
        // Define interface for property
        interface PropertyType {
          name: string;
          type?: string;
          value: any;
        }
        
        // Find collision layer
        const collisionLayer = mapJson.layers.find(
          (layer) => 
            layer.name === 'collision' ||
            layer.name === 'Collision' ||
            (layer.properties && layer.properties.some(
              (prop: PropertyType) => prop.name === 'collidable' && prop.value === true
            ))
        );
        
        if (collisionLayer && collisionLayer.data) {
          setCollisionData(collisionLayer.data);
        }
        
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading map:', error);
        setMapLoaded(true); // Set to true anyway to prevent infinite loading
      }
    };
    
    loadMap();
  }, [mapPath, tilesetPaths, setMapData]);
  
  // Handle player movement and viewport updates
  useEffect(() => {
    if (!mapLoaded || !localMapData) return;
    
    // Calculate viewport to keep player centered
    const { width: mapWidth, height: mapHeight } = map;
    const { screenWidth, screenHeight } = ui;
    
    // Determine the gameplay area height (full screen minus controls area)
    const gameplayHeight = screenHeight; 
    
    // Calculate new viewport coordinates
    const newViewport = calculateViewport(
      player.x,
      player.y,
      screenWidth,
      gameplayHeight,
      mapWidth,
      mapHeight,
      gameplayHeight
    );
    
    setViewport(newViewport.x, newViewport.y);
    
    // Check for nearby objects
    const nearbyObject = findNearbyObject(player.x, player.y, map.interactiveObjects);
    setNearbyObject(nearbyObject);
    
  }, [player.x, player.y, mapLoaded, localMapData, map.width, map.height, ui.screenWidth, ui.screenHeight]);
  
  // Helper function to get tileset for a specific tile ID
  const getTilesetForTile = (gid: number) => {
    // Find the tileset this tile belongs to
    for (let i = tilesets.length - 1; i >= 0; i--) {
      if (gid >= tilesets[i].firstgid) {
        return tilesets[i];
      }
    }
    return null;
  };
  
  // Helper function to render a tile
  const renderTile = (gid: number, x: number, y: number) => {
    // Skip empty tiles (gid = 0)
    if (gid === 0) return null;
    
    const tileset = getTilesetForTile(gid);
    if (!tileset || !tileset.imageSource) return null;
    
    // Calculate the local tile index within the tileset
    const localId = gid - tileset.firstgid;
    
    // Calculate tile position within the tileset image
    const tilesPerRow = Math.floor(tileset.imageWidth / tileset.tileWidth) || 1;
    const tileX = (localId % tilesPerRow) * tileset.tileWidth;
    const tileY = Math.floor(localId / tilesPerRow) * tileset.tileHeight;
    
    // Calculate visible position (relative to viewport)
    const visibleX = x - map.viewportX;
    const visibleY = y - map.viewportY;
    
    // Skip tiles that are outside the viewport
    if (
      visibleX < -tileset.tileWidth || 
      visibleX > ui.screenWidth || 
      visibleY < -tileset.tileHeight || 
      visibleY > ui.screenHeight
    ) {
      return null;
    }
    
    return (
      <View 
        key={`tile-${x}-${y}-${gid}`}
        style={[
          styles.tile,
          {
            width: tileset.tileWidth,
            height: tileset.tileHeight,
            left: visibleX,
            top: visibleY,
          }
        ]}
      >
        <Image 
          source={tileset.imageSource}
          style={{
            width: tileset.imageWidth,
            height: tileset.imageHeight,
            transform: [
              { translateX: -tileX },
              { translateY: -tileY }
            ]
          }}
        />
      </View>
    );
  };
  
  // Render layers and tiles
  const renderLayers = () => {
    if (!mapLoaded || !localMapData) return null;
    
    const layers = [];
    
    for (const layer of localMapData.layers) {
      // Skip object layers and non-visible layers
      if (layer.type === 'objectgroup' || !layer.visible) {
        continue;
      }
      
      // For tile layers, render each tile
      if (layer.type === 'tilelayer' && layer.data) {
        const layerTiles = [];
        
        for (let y = 0; y < layer.height; y++) {
          for (let x = 0; x < layer.width; x++) {
            const tileIndex = y * layer.width + x;
            const gid = layer.data[tileIndex];
            
            if (gid !== 0) { // Skip empty tiles
              const tileX = x * localMapData.tilewidth;
              const tileY = y * localMapData.tileheight;
              
              layerTiles.push(renderTile(gid, tileX, tileY));
            }
          }
        }
        
        layers.push(
          <View key={`layer-${layer.id}`} style={styles.layer}>
            {layerTiles}
          </View>
        );
      }
    }
    
    return layers;
  };
  
  if (!mapLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Map layers */}
      {renderLayers()}
      
      {/* Fallback message if needed */}
      {usedFallback && (
        <View style={styles.fallbackMessage}>
          <Text style={styles.fallbackText}>Using fallback map</Text>
        </View>
      )}
      
      {/* Player sprite */}
      <PlayerSprite
        x={player.x}
        y={player.y}
        direction={player.direction}
        isMoving={player.isMoving}
        viewportX={map.viewportX}
        viewportY={map.viewportY}
      />
      
      {/* Debug view for nearby object */}
      {map.interactiveObjects.map(obj => {
        const isNearby = state.interaction.nearbyObject?.id === obj.id;
        
        // Skip rendering objects that are outside of viewport
        const visibleX = obj.x - map.viewportX;
        const visibleY = obj.y - map.viewportY;
        
        if (
          visibleX < -obj.width || 
          visibleX > ui.screenWidth || 
          visibleY < -obj.height || 
          visibleY > ui.screenHeight
        ) {
          return null;
        }
        
        return (
          <View
            key={`object-${obj.id}`}
            style={[
              styles.interactiveObject,
              {
                left: visibleX,
                top: visibleY,
                width: obj.width,
                height: obj.height,
                borderColor: isNearby ? '#FFD700' : 'transparent',
                backgroundColor: isNearby ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tile: {
    position: 'absolute',
    overflow: 'hidden',
  },
  interactiveObject: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    zIndex: 5,
  },
  fallbackMessage: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
    zIndex: 10,
  },
  fallbackText: {
    color: 'white',
    fontSize: 10,
  },
});
