import { useState, useRef } from 'react';
import { ImageSourcePropType, View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from "expo-image";
import * as MediaLibrary from 'expo-media-library';
import { CameraView, CameraMode, CameraType, useCameraPermissions } from 'expo-camera';
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { captureRef } from 'react-native-view-shot';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import domtoimage from 'dom-to-image';

import Button from '@/components/Button';
import ImageViewer from '@/components/ImageViewer';
import IconButton from '@/components/IconButton';
import CircleButton from '@/components/CircleButton';
import EmojiPicker from '@/components/EmojiPicker';
import EmojiList from '@/components/EmojiList';
import EmojiSticker from '@/components/EmojiSticker';

import PlaceholderImage from '@/assets/images/background-image.png';

export default function Camera() {
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const screenshotRef = useRef<View>(null);
  const cameraRef = useRef<CameraView>(null);
  const [cameraUri, setCameraUri] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [cameraRecording, setCameraRecording] = useState(false);

  if (mediaPermission === null) {
    requestMediaPermission();
  }

  if (!cameraPermission) {
    return null;
  }

  if (!cameraPermission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Les autorisations de Caméra doivent être accordées </Text>
        <Button theme="primary" label="Prendre une photo" onPress={requestCameraPermission} />
      </View>
    );
  }
  
  const toggleCameraFacing = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  
  const takeCameraPicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    setCameraUri(photo?.uri ?? null);
  };

  const recordCameraVideo = async () => {
    if (cameraRecording) {
      setCameraRecording(false);
      cameraRef.current?.stopRecording();
      return;
    }
    setCameraRecording(true);
    const video = await cameraRef.current?.recordAsync();
    console.log({ video });
  };

  const toggleCameraMode = () => {
    setCameraMode((prev) => (prev === "picture" ? "video" : "picture"));
  };

  const toggleFacing = () => {
    setCameraFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const onSaveCameraImageAsync = async () => {
    try {
      if (cameraUri) {
        await MediaLibrary.saveToLibraryAsync(cameraUri);
        alert('Saved!');
        setCameraUri(null);
      } else {
        alert('No image to save.');
      }
    } catch (e) {
      console.log(e);
    }
  };

  if (cameraUri) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.imageContainer}>
          <View ref={screenshotRef} collapsable={false}>
            <Image
              source={cameraUri ? { uri: cameraUri } : undefined}
              contentFit="contain"
              style={{ width: 400, aspectRatio: 1 }}
            />
          </View>
          <View style={styles.optionsContainer}>
            <View style={styles.optionsRow}>
              <IconButton icon="refresh" label="Nouvelle photo" onPress={() => setCameraUri(null)} />
              <IconButton icon="save-alt" label="Sauvegarder" onPress={onSaveCameraImageAsync} />
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
      
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        mode={cameraMode}
        facing={cameraFacing}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <Pressable onPress={toggleCameraMode}>
            {cameraMode === "picture" ? (
              <Feather name="video" size={32} color="white" />
            ) : (
              <AntDesign name="camera" size={32} color="white" />
            )}
          </Pressable>
          <Pressable onPress={cameraMode === "picture" ? takeCameraPicture : recordCameraVideo}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: cameraMode === "picture" ? "white" : "red",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="camera-rotate" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  imageContainer: {
    flex: 1,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 50,
  },
  optionsRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
