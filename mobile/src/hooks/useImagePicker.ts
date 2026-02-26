// ══════════════════════════════════════════════════════════════
// Dressly — useImagePicker Hook
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { LIMITS } from '@/constants';

interface PickedImage {
  uri: string;
  base64: string | null;
  width: number;
  height: number;
  mimeType: string;
}

export function useImagePicker() {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to use this feature.',
          [{ text: 'OK' }],
        );
        return false;
      }
    }
    return true;
  }, []);

  const pickFromGallery = useCallback(
    async (
      allowMultiple = false,
    ): Promise<PickedImage[]> => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return [];

      setIsLoading(true);
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: !allowMultiple,
          allowsMultipleSelection: allowMultiple,
          selectionLimit: allowMultiple ? LIMITS.MAX_GENERATION_IMAGES : 1,
          quality: 0.8,
          base64: true,
          exif: false,
        });

        if (result.canceled || !result.assets) return [];

        return result.assets.map((asset) => ({
          uri: asset.uri,
          base64: asset.base64 ?? null,
          width: asset.width,
          height: asset.height,
          mimeType: asset.mimeType ?? 'image/jpeg',
        }));
      } catch (err) {
        console.error('Image pick error:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [requestPermissions],
  );

  const takePhoto = useCallback(async (): Promise<PickedImage | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        base64: asset.base64 ?? null,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType ?? 'image/jpeg',
      };
    } catch (err) {
      console.error('Camera error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermissions]);

  const showPicker = useCallback(async (): Promise<PickedImage[]> => {
    return new Promise((resolve) => {
      Alert.alert('Add Photo', 'Choose an option', [
        {
          text: 'Camera',
          onPress: async () => {
            const photo = await takePhoto();
            resolve(photo ? [photo] : []);
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const photos = await pickFromGallery(false);
            resolve(photos);
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve([]) },
      ]);
    });
  }, [takePhoto, pickFromGallery]);

  return {
    pickFromGallery,
    takePhoto,
    showPicker,
    isLoading,
  };
}
