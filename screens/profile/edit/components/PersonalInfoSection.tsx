import * as React from 'react';
import { View, Text } from 'react-native';
import { User, AtSign } from 'lucide-react-native';
import { InputField } from './InputField';
import { styles } from '../styles';

interface PersonalInfoSectionProps {
  fullName: string;
  setFullName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  validationErrors: { [key: string]: string };
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  fullName,
  setFullName,
  email,
  setEmail,
  validationErrors,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <View style={styles.inputGroup}>
        <InputField
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          icon={<User size={20} color="#666" style={styles.inputIcon} />}
          keyboardType="default"
          secureTextEntry={false}
          showToggle={false}
          errorKey="fullName"
          validationErrors={validationErrors}
        />
        <InputField
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          icon={<AtSign size={20} color="#666" style={styles.inputIcon} />}
          keyboardType="email-address"
          secureTextEntry={false}
          showToggle={false}
          errorKey="email"
          validationErrors={validationErrors}
        />
      </View>
    </View>
  );
};