/**
 * Calculates an initial region focused on the area with the most dive sites
 * @param sites Array of dive sites with valid coordinates
 * @returns Region object with latitude, longitude, and delta values
 */
export const calculateInitialRegionForDenseArea = (sites: any[]) => {
  // Europe region to show a broader view
  const europeRegion = {
    latitude: 54,
    longitude: 15,
    latitudeDelta: 40,
    longitudeDelta: 40,
  };
  
  if (sites.length === 0) {
    return europeRegion;
  }

  // Check if any sites are in the Netherlands area
  const netherlandsSites = sites.filter(site => {
    // Safely access coordinates
    if (!site?.geometry?.coordinates || !Array.isArray(site.geometry.coordinates)) {
      return false;
    }
    
    const lat = site.geometry.coordinates[1];
    const lng = site.geometry.coordinates[0];
    
    // Rough bounds for Netherlands: lat 50-54, lng 3-8
    return typeof lat === 'number' && typeof lng === 'number' && 
           lat >= 50 && lat <= 54 && lng >= 3 && lng <= 8;
  });

  // If we have sites in Netherlands, still show Europe view to provide context
  if (netherlandsSites.length > 0) {
    return europeRegion;
  }

  // If no sites in Netherlands, still default to Europe view for better context
  return europeRegion;
};

/**
 * Filters dive sites to only include those with valid coordinates
 * @param diveSites Array of dive sites
 * @returns Array of dive sites with valid coordinates in GeoJSON format
 */
export const prepareValidSitesForClustering = (diveSites: any[]) => {
  if (!Array.isArray(diveSites)) {
    return [];
  }
  
  return diveSites
    .filter(site => 
      site.latitude !== null && site.longitude !== null && 
      site.latitude !== undefined && site.longitude !== undefined &&
      typeof site.latitude === 'number' && typeof site.longitude === 'number'
    )
    .map(site => ({
      type: 'Feature',
      id: site.id,
      properties: {
        id: site.id,
        name: site.name,
      },
      geometry: {
        type: 'Point',
        coordinates: [site.longitude, site.latitude], // [longitude, latitude]
      },
    }));
};