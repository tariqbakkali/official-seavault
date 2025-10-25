import React from 'react';
import { render } from '@testing-library/react-native';
import SimpleMapView from './SimpleMapView';

// Mock expo-maps since it's not available in test environment
jest.mock('expo-maps', () => ({
  GoogleMaps: {
    View: 'GoogleMapsView'
  },
  AppleMaps: {
    View: 'AppleMapsView'
  }
}));

describe('SimpleMapView', () => {
  const mockData = [
    {
      id: '1',
      geometry: {
        coordinates: [10.0, 20.0]
      },
      properties: {
        name: 'Test Site'
      }
    }
  ];

  const mockInitialRegion = {
    latitude: 20.0,
    longitude: 10.0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  };

  const mockRenderMarker = jest.fn((data) => ({
    id: data.id,
    coordinates: {
      latitude: data.geometry.coordinates[1],
      longitude: data.geometry.coordinates[0]
    },
    title: data.properties.name
  }));

  it('renders without crashing', () => {
    const { getByTestId } = render(
      <SimpleMapView
        data={mockData}
        initialRegion={mockInitialRegion}
        renderMarker={mockRenderMarker}
      />
    );
    
    // Component should render without errors
    expect(getByTestId).toBeDefined();
  });

  it('processes marker data correctly', () => {
    render(
      <SimpleMapView
        data={mockData}
        initialRegion={mockInitialRegion}
        renderMarker={mockRenderMarker}
      />
    );
    
    // Check if renderMarker was called with the correct data
    expect(mockRenderMarker).toHaveBeenCalledWith(mockData[0]);
  });
});