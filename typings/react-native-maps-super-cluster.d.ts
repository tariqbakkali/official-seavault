declare module 'react-native-maps-super-cluster' {
    import { ComponentType } from 'react';
    import { ViewStyle, StyleProp } from 'react-native';
    import { Region } from 'react-native-maps';
  
    interface ClusteredMapViewProps {
      style?: StyleProp<ViewStyle>;
      data: any[];
      initialRegion: Region;
      renderMarker: (data: any) => React.ReactNode;
      renderCluster?: (cluster: any, onPress: () => void) => React.ReactNode;
      preserveClusterPressBehavior?: boolean;
      clusteringEnabled?: boolean;
      onClusterPress?: (clusterId: string, children: any[]) => void;
      [key: string]: any;
    }
  
    const ClusteredMapView: ComponentType<ClusteredMapViewProps>;
    export default ClusteredMapView;
  }