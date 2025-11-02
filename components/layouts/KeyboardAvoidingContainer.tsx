// src/components/KeyboardAvoidingContainer.tsx
import React from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    ViewStyle,
} from 'react-native';

interface KeyboardAvoidingContainerProps {
    children: React.ReactNode;
    contentContainerStyle?: ViewStyle;
    keyboardVerticalOffset?: number;
}

const KeyboardAvoidingContainer: React.FC<KeyboardAvoidingContainerProps> = ({
    children,
    contentContainerStyle,
    keyboardVerticalOffset = Platform.OS === 'ios' ? 90 : 0,
}) => {
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={[
                        { flexGrow: 1 },
                        contentContainerStyle,
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default KeyboardAvoidingContainer;