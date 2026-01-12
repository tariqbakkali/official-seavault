import { observable } from '@legendapp/state';
import NetInfo from '@react-native-community/netinfo';

// Observable to track network state centrally
export const isOnline$ = observable(true);

// Initialize network state observer
NetInfo.addEventListener(state => {
  const isOnline = !!(state.isConnected && state.isInternetReachable);
  console.log('[NetworkStore] Network state changed:', { isConnected: state.isConnected, isInternetReachable: state.isInternetReachable, isOnline });
  isOnline$.set(isOnline);
});

export const getIsOnline = () => isOnline$.get();
