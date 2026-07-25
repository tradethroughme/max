import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { authApi } from '../../services/api/auth.api';
import * as Haptics from 'expo-haptics';

export const PhoneInputScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const fullNumber = countryCode + phoneNumber;
      const response = await authApi.sendOTP(fullNumber);

      if (response.success) {
        navigation.navigate('OTP', {
          phoneNumber: fullNumber,
          isNewUser: response.isNewUser,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingTop: 60 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: spacing.xxl }}
        >
          <Icon name="back" size={28} color={colors.text} />
        </TouchableOpacity>

        <Text style={{
          fontSize: typography.sizes.display,
          fontFamily: typography.weights.bold,
          color: colors.text,
          marginBottom: spacing.sm,
        }}>
          Enter your
        </Text>
        <Text style={{
          fontSize: typography.sizes.display,
          fontFamily: typography.weights.bold,
          color: colors.primary,
          marginBottom: spacing.md,
        }}>
          phone number
        </Text>

        <Text style={{
          fontSize: typography.sizes.body,
          fontFamily: typography.weights.regular,
          color: colors.textSecondary,
          marginBottom: spacing.xxxl,
        }}>
          We'll send you a verification code
        </Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.input,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <TouchableOpacity
            onPress={() => {
              // Country picker modal
            }}
            style={{
              paddingRight: spacing.sm,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              paddingVertical: spacing.md,
            }}
          >
            <Text style={{
              fontSize: typography.sizes.bodyLarge,
              fontFamily: typography.weights.medium,
              color: colors.text,
            }}>
              {countryCode}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              fontSize: typography.sizes.bodyLarge,
              fontFamily: typography.weights.medium,
              color: colors.text,
            }}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          onPress={handleSendOTP}
          disabled={loading || phoneNumber.length < 10}
          style={{
            marginTop: spacing.xxxl,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: spacing.sm,
            opacity: phoneNumber.length >= 10 ? 1 : 0.5,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={{
                fontSize: typography.sizes.bodyLarge,
                fontFamily: typography.weights.semiBold,
                color: '#FFFFFF',
              }}>
                Continue
              </Text>
              <Icon name="chevronRight" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <Text style={{
          marginTop: spacing.xl,
          fontSize: typography.sizes.small,
          fontFamily: typography.weights.regular,
          color: colors.textTertiary,
          textAlign: 'center',
        }}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};
