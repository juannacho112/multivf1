// Define tilesets for the map
export const tilesets = {
  'Floors_only_32x32': {
    name: 'Floors_only_32x32',
    width: 192,  // 6 tiles x 32px
    height: 32,
    tileWidth: 32,
    tileHeight: 32,
    firstgid: 1
  },
  'Modern_Office_32x32': {
    name: 'Modern_Office_32x32',
    width: 3072,  // 96 tiles x 32px
    height: 32,
    tileWidth: 32,
    tileHeight: 32,
    firstgid: 7
  }
};

// Import actual tileset images
export const tilesetImages = {
  //Sample-NotWorking'Floors_only_32x32': require('../../../Assets/Modern_Office_Revamped_v1.2/Floors_only_32x32.png'),
  'Floors_only_32x32': require('/home/user/sample-ai-app-1/json_tiled_Map_uploads/Assets/Modern_Office_Revamped_v1.2/Floors_only_32x32.png'),
  //'Modern_Office_32x32': require('../../../Assets/Modern_Office_Revamped_v1.2/Modern_Office_32x32.png')
  'Modern_Office_32x32': require('/home/user/sample-ai-app-1/json_tiled_Map_uploads/Assets/Modern_Office_Revamped_v1.2/Modern_Office_32x32.png')
};
