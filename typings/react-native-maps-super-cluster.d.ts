declare module 'react-native-maps-super-cluster' {
  import { ComponentType } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';
  import { GoogleMaps } from 'expo-maps';
  import Supercluster from 'supercluster';

  interface ClusteredMapViewProps {
    style?: StyleProp<ViewStyle>;
    data: any[];
    initialRegion: any; // expo-maps uses different region format
    renderMarker: (data: any) => React.ReactNode;
    renderCluster?: (cluster: Supercluster.ClusterFeature<any>, onPress: () => void) => React.ReactNode;
    preserveClusterPressBehavior?: boolean;
    clusteringEnabled?: boolean;
    onClusterPress?: (clusterId: string, children: any[]) => void;
    [key: string]: any;
  }

  const ClusteredMapView: ComponentType<ClusteredMapViewProps>;
  export default ClusteredMapView;
}