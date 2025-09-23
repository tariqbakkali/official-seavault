import { Alert } from 'react-native';

export const showAlert = (title: string, message: string, onOkPress?: () => void) => {
  Alert.alert(title, message, [{ text: 'OK', onPress: onOkPress }]);
};