import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { Image } from "expo-image";
import * as MediaLibrary from 'expo-media-library';
import { CameraView, CameraMode, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import domtoimage from 'dom-to-image';

import Button from '@/components/Button';
import IconButton from '@/components/IconButton';

import { DeviceMotion } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';


export default function Camera() {
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [sensorsPermission, setSensorsPermission] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<ScreenOrientation.Orientation | null>(null);
  const screenshotRef = useRef<View>(null);
  const cameraRef = useRef<CameraView>(null);
  const [cameraUri, setCameraUri] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [cameraRecording, setCameraRecording] = useState(false);
  const [cameraFlash, setCameraFlash] = useState<FlashMode>("off");

  const lockOrientation = async () => {
    await ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      // if (orientationInfo.orientation === ScreenOrientation.Orientation.PORTRAIT_UP) {
      //   ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      // } else {
      //   ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      // }
      setDeviceOrientation(orientationInfo.orientation);
      
    })    
  };

  useEffect(() => {
    lockOrientation();
  }, []);
  
  const requestSensorsPermission = async () => {
    const permissions = await DeviceMotion.requestPermissionsAsync();
    setSensorsPermission(permissions.granted);
  }

  const getSensorsPermission = async() => {
    await DeviceMotion.getPermissionsAsync();
  } 
  
  if (mediaPermission === null) {
    requestMediaPermission();
  }

  if (!cameraPermission) {
    return null;
  }

  if (!cameraPermission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={portrait.container}>
        <Text style={portrait.message}>Les autorisations de Caméra doivent être accordées </Text>
        <Button theme="primary" label="Activer les autorisations de Caméra" onPress={requestCameraPermission} />
      </View>
    );
  }

  if (!sensorsPermission) {
    // Sensors permissions are not granted yet.
    return (
      <View style={portrait.container}>
        <Text style={portrait.message}>Les autorisations de capteurs doivent être accordées </Text>
        <Button theme="primary" label="Activer les autorisations de capteurs" onPress={requestSensorsPermission} />
      </View>
    );
  }

  const toggleCameraFlash = () => {
    if (cameraFlash === "off") {
      setCameraFlash("on");
    } else if (cameraFlash === "on") {
      setCameraFlash("auto");
    } else {
      setCameraFlash("off");
    }
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

  const onSaveCameraImageAsync = async () => {
    try {
      if (cameraUri) {
        if (Platform.OS !== 'web') {
          await MediaLibrary.saveToLibraryAsync(cameraUri);
          alert('Saved!');
          setCameraUri(null);
        } else {
          try {
            const dataUrl = await domtoimage.toJpeg(screenshotRef.current, {
              quality: 0.95,
              width: 320,
              height: 440,
            });
    
            let link = document.createElement('a');
            link.download = 'sticker-smash.jpeg';
            link.href = dataUrl;
            link.click();
            alert('Saved!');
            setCameraUri(null);
          } catch (e) {
            console.log(e);
          }
        }
      } else {
        alert('No image to save.');
      }
    } catch (e) {
      console.log(e);
    }
  };

  if (cameraUri) {
    return (
      <GestureHandlerRootView style={portrait.container}>
        <View style={portrait.imageContainer}>
          <View ref={screenshotRef} collapsable={false}>
            <Image
              source={cameraUri ? { uri: cameraUri } : undefined}
              contentFit="contain"
              style={{ width: 400, aspectRatio: 1 }}
            />
          </View>
          <View style={portrait.optionsContainer}>
            <View style={portrait.optionsRow}>
              <IconButton icon="refresh" label="Nouvelle photo" onPress={() => setCameraUri(null)} />
              <IconButton icon="save-alt" label="Sauvegarder" onPress={onSaveCameraImageAsync} />
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
      
    );
  }

  return (
    <View style={portrait.container}>
      <CameraView
        animateShutter
        style={portrait.camera}
        ref={cameraRef}
        mode={cameraMode}
        facing={cameraFacing}
        mute={false}
        flash={cameraFlash}
        responsiveOrientationWhenOrientationLocked
        onMountError={(error) => console.error('Camera mount error:', error)}
      >
        <View style={deviceOrientation === 3 ? landscape.flashContainer : portrait.flashContainer}>
          <Pressable onPress={toggleCameraFlash}>
            {cameraFlash === "off" ? (
              <MaterialCommunityIcons name="flash-off" size={deviceOrientation === 3 ? 24 : 32} color="#fff" />
            ) : cameraFlash === "on" ? (
              <MaterialCommunityIcons name="flash" size={deviceOrientation === 3 ? 24 : 32} color="#fc791a" />
            ) : cameraFlash === "auto" ? (
              <MaterialCommunityIcons name="flash-auto" size={deviceOrientation === 3 ? 24 : 32} color="#fc791a" />
            ) : (
              <MaterialCommunityIcons name="flash-off" size={deviceOrientation === 3 ? 24 : 32} color="#fff" />
            )}
          </Pressable>
        </View>
        <View style={deviceOrientation === 3 ? landscape.shutterContainer : portrait.shutterContainer}>
          <Pressable onPress={toggleCameraMode}>
            {cameraMode === "picture" ? (
              <Feather name="video" size={deviceOrientation === 3 ? 24 : 32} color="white" />
            ) : (
              <AntDesign name="camera" size={deviceOrientation === 3 ? 24 : 32} color="white" />
            )}
          </Pressable>
          <Pressable onPress={cameraMode === "picture" ? takeCameraPicture : recordCameraVideo}>
            {({ pressed }) => (
              <View
                style={[
                  deviceOrientation === 3 ? landscape.shutterBtn : portrait.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    portrait.shutterBtnInner,
                    {
                      backgroundColor: cameraMode === "picture" ? "white" : "red",
                    },
                  ]} />
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleCameraFacing}>
            <FontAwesome6 name="camera-rotate" size={deviceOrientation === 3 ? 24 : 32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const portrait = StyleSheet.create({
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
  flashContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
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

const landscape = StyleSheet.create({
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
  flashContainer: {
    position: 'absolute',
    top: 30,
    left: 20,
  },
  shutterContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "100%",
    alignItems: "flex-end",
    flexDirection: "column",
    justifyContent: "space-around",
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