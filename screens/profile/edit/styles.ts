import { StyleSheet, Dimensions } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

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
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingTop: DIMENSIONS.PADDING_LG,
    paddingBottom: DIMENSIONS.PADDING_LG,
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
    fontSize: TYPOGRAPHY.SIZE_XXL,
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
    fontSize: TYPOGRAPHY.SIZE_XXXL,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_LG,
  },
  loadingText: {
    color: '#666',
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  section: {
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: '600',
    color: '#fff',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  dangerSection: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    marginTop: DIMENSIONS.SPACE_LG,
  },
  dangerSectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_LG,
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
    fontSize: TYPOGRAPHY.SIZE_MD,
    textAlign: 'center',
  },
  inputGroup: {
    gap: DIMENSIONS.SPACE_LG,
  },
  inputWrapper: {
    gap: DIMENSIONS.SPACE_SM,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_XS,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#2a1a1a',
  },
  inputIcon: {
    marginRight: DIMENSIONS.SPACE_LG,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  eyeIcon: {
    padding: DIMENSIONS.PADDING_XS,
    marginLeft: DIMENSIONS.SPACE_SM,
  },
  validIcon: {
    marginLeft: DIMENSIONS.SPACE_SM,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_XS,
    paddingHorizontal: DIMENSIONS.PADDING_XS,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: TYPOGRAPHY.SIZE_MD,
    flex: 1,
  },
  passwordStrengthContainer: {
    marginTop: DIMENSIONS.SPACE_SM,
    gap: DIMENSIONS.SPACE_SM,
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACE_XS,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    borderRadius: DIMENSIONS.RADIUS_XS,
    backgroundColor: '#333',
  },
  passwordStrengthText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_LG,
    gap: DIMENSIONS.SPACE_SM,
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
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    color: '#fff',
  },
  dangerButtonText: {
    color: '#FF3B30',
  },
  linkText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: DIMENSIONS.SPACE_LG,
    textDecorationLine: 'underline',
  },
  successOverlay: {
    position: 'absolute',
    top: 100,
    left: DIMENSIONS.PADDING_LG,
    right: DIMENSIONS.PADDING_LG,
    alignItems: 'center',
    zIndex: 1000,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_SM,
    borderRadius: 25,
    gap: DIMENSIONS.SPACE_SM,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  successText: {
    color: '#34C759',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '500',
  },
});