import { useState, useRef } from 'react';
import { ImageBackground, View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import domtoimage from 'dom-to-image';

import Button from '@/components/Button';
import ImageViewer from '@/components/ImageViewer';
import IconButton from '@/components/IconButton';

import PlaceholderImage from '@/assets/images/couple-sunset.png';
import { BlurView } from 'expo-blur';
import { uploadImageToS3 } from '@/services/awsS3';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 120,
    display: 'flex',
    justifyContent: 'center',
    margin: 0,
    overflow: 'hidden'
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  imageContainer: {
    flex: 1,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerContainer: {
    marginTop: 30,
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
    marginTop: 30,
    flex: 1 / 3,
    alignItems: 'center',
  },
  optionsRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

const Download = () => {
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const screenshotRef = useRef<View>(null);

  if (mediaPermission === null) {
    requestMediaPermission();
  }

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    } else {
      alert("Vous n'avez sélectionné aucune image. Veuillez réessayer.");
    }
  };

  const onSaveImageAsync = async () => {
    const date = Date.now();
    const filename = `${date}.jpeg`;
    if (Platform.OS !== 'web') {
      try {
        const localUri = await captureRef(screenshotRef, {
          height: 440,
          quality: 1,
        });

        await MediaLibrary.saveToLibraryAsync(localUri);
        await uploadImageToS3(localUri, filename);
        if (localUri) {
          alert('Saved!');
          setSelectedImage(undefined);
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const dataUrl = await domtoimage.toJpeg(screenshotRef.current, {
          quality: 0.95,
          width: 320,
          height: 440,
        });
        console.log(dataUrl);
        await uploadImageToS3(dataUrl, filename);

        let link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        setSelectedImage(undefined);
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <ImageBackground
        source={PlaceholderImage} // or a local file
        resizeMode="cover" // or 'contain', 'stretch'
        style={styles.background}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View >
          <View style={styles.imageContainer}ref={screenshotRef} collapsable={false}>
            {selectedImage && <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />}
          </View>
          {selectedImage ? (
            <View style={styles.optionsContainer}>
              <View style={styles.optionsRow}>
                <IconButton icon="refresh" label="Nouvelle photo" onPress={pickImageAsync} />
                <IconButton icon="save-alt" label="Sauvegarder" onPress={onSaveImageAsync} />
              </View>
            </View>
          ) : (
            <View style={styles.footerContainer}>
              <Button theme="primary" label="Télécharger une image" onPress={pickImageAsync} />
            </View>
          )}
      </View>
    </ImageBackground>
  </GestureHandlerRootView>
  );
}

export default  Download;