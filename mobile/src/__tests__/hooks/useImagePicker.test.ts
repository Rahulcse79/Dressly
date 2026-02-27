// ─── useImagePicker Hook Tests ──────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { useImagePicker } from '../../hooks/useImagePicker';

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

describe('useImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  // ── Initial State ─────────────────────────────────────────

  it('isLoading is initially false', () => {
    const { result } = renderHook(() => useImagePicker());
    expect(result.current.isLoading).toBe(false);
  });

  it('returns pickFromGallery function', () => {
    const { result } = renderHook(() => useImagePicker());
    expect(typeof result.current.pickFromGallery).toBe('function');
  });

  it('returns takePhoto function', () => {
    const { result } = renderHook(() => useImagePicker());
    expect(typeof result.current.takePhoto).toBe('function');
  });

  // ── pickFromGallery ───────────────────────────────────────

  it('picks single image from gallery', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///photo.jpg',
          base64: 'base64data',
          width: 1080,
          height: 1920,
          mimeType: 'image/jpeg',
        },
      ],
    });

    const { result } = renderHook(() => useImagePicker());

    let images: any[] = [];
    await act(async () => {
      images = await result.current.pickFromGallery(false);
    });

    expect(images).toHaveLength(1);
    expect(images[0].uri).toBe('file:///photo.jpg');
    expect(images[0].base64).toBe('base64data');
    expect(images[0].width).toBe(1080);
    expect(images[0].height).toBe(1920);
    expect(images[0].mimeType).toBe('image/jpeg');
  });

  it('returns empty array when user cancels', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    const { result } = renderHook(() => useImagePicker());

    let images: any[] = [];
    await act(async () => {
      images = await result.current.pickFromGallery(false);
    });

    expect(images).toEqual([]);
  });

  it('returns empty array when permissions denied', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const { result } = renderHook(() => useImagePicker());

    let images: any[] = [];
    await act(async () => {
      images = await result.current.pickFromGallery();
    });

    expect(images).toEqual([]);
  });

  it('picks multiple images', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///1.jpg', base64: 'b1', width: 100, height: 100, mimeType: 'image/jpeg' },
        { uri: 'file:///2.jpg', base64: 'b2', width: 200, height: 200, mimeType: 'image/png' },
        { uri: 'file:///3.jpg', base64: 'b3', width: 300, height: 300, mimeType: 'image/webp' },
      ],
    });

    const { result } = renderHook(() => useImagePicker());

    let images: any[] = [];
    await act(async () => {
      images = await result.current.pickFromGallery(true);
    });

    expect(images).toHaveLength(3);
  });

  it('handles null base64 gracefully', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///photo.jpg', base64: undefined, width: 100, height: 100, mimeType: undefined },
      ],
    });

    const { result } = renderHook(() => useImagePicker());

    let images: any[] = [];
    await act(async () => {
      images = await result.current.pickFromGallery();
    });

    expect(images).toHaveLength(1);
    expect(images[0].base64).toBeNull();
    expect(images[0].mimeType).toBe('image/jpeg'); // Default fallback
  });

  it('sets isLoading during pick operation', async () => {
    let resolveLibrary: any;
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockReturnValue(
      new Promise((r) => (resolveLibrary = r))
    );

    const { result } = renderHook(() => useImagePicker());

    let pickPromise: Promise<any>;
    act(() => {
      pickPromise = result.current.pickFromGallery();
    });

    // Loading should be true while picking
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveLibrary({ canceled: true, assets: null });
      await pickPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('handles error during pick', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValue(
      new Error('Failed to open gallery')
    );

    const { result } = renderHook(() => useImagePicker());

    let images: any[] = [];
    await act(async () => {
      images = await result.current.pickFromGallery();
    });

    expect(images).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  // ── takePhoto ─────────────────────────────────────────────

  it('takes photo with camera', async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///camera.jpg',
          base64: 'cam64',
          width: 1080,
          height: 1920,
          mimeType: 'image/jpeg',
        },
      ],
    });

    const { result } = renderHook(() => useImagePicker());

    let photo: any;
    await act(async () => {
      photo = await result.current.takePhoto();
    });

    expect(photo).toBeTruthy();
    expect(photo.uri).toBe('file:///camera.jpg');
  });

  it('returns null when camera is cancelled', async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null,
    });

    const { result } = renderHook(() => useImagePicker());

    let photo: any;
    await act(async () => {
      photo = await result.current.takePhoto();
    });

    expect(photo).toBeNull();
  });

  it('returns null when camera permission denied', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const { result } = renderHook(() => useImagePicker());

    let photo: any;
    await act(async () => {
      photo = await result.current.takePhoto();
    });

    expect(photo).toBeNull();
  });
});
