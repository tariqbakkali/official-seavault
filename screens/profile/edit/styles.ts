import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  unsavedIndicator: {
    width: 40,
    alignItems: 'center',
  },
  unsavedText: {
    color: '#007AFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dangerSection: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    marginTop: 20,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  avatarHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 16,
  },
  inputWrapper: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#2a1a1a',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  validIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    gap: 8,
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dangerButtonText: {
    color: '#FF3B30',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 12,
    textDecorationLine: 'underline',
  },
  successOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  successText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '500',
  },
});