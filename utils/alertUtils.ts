import { Alert } from 'react-native';

export const showAlert = (title: string, message: string, onOkPress?: () => void) => {
  Alert.alert(title, message, [{ text: 'OK', onPress: onOkPress }]);
};

/**
 * Show an alert with a retry option for network errors
 */
export const showAlertWithRetry = (
  title: string,
  message: string,
  onRetry: () => void,
  onCancel?: () => void
) => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    { text: 'Retry', onPress: onRetry },
  ]);
};