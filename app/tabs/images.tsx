import { useState, useEffect } from 'react';
import { ImageSourcePropType, View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import domtoimage from 'dom-to-image';
import { AntDesign } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  PutObjectCommand,
  type ListObjectsCommandOutput,
  ListObjectsCommand,
  GetObjectCommand,
  NoSuchKey,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import Button from '@/components/Button';
import ImageViewer from '@/components/ImageViewer';
import IconButton from '@/components/IconButton';

import PlaceholderImage from '@/assets/images/undraw_no-data_ig65.png';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#e1edfd',
    alignItems: 'center',
    backgroundImage: `url(${PlaceholderImage})`,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  imageContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerContainer: {
    marginTop: 30,
    flex: 1/6,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    marginTop: 20,
  },
  optionsRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

const Images = () => {
  const [objects, setObjects] = useState<
    Required<ListObjectsCommandOutput>["Contents"]
  >([]);
  const [selectedObject, setSelectedObject] = useState<NonNullable<ListObjectsCommandOutput["Contents"]>[0] | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageSourcePropType | null>(null);

  const S3client = new S3Client({
    // The AWS Region where the Amazon Simple Storage Service (Amazon S3) bucket will be created. Replace this with your Region.
    region: "us-east-1",
    credentials: fromCognitoIdentityPool({
      // Replace the value of 'identityPoolId' with the ID of an Amazon Cognito identity pool in your Amazon Cognito Region.
      identityPoolId: "us-east-1:de85a9f3-8d3e-485e-b2bb-6b6109fcd91e",
      // Replace the value of 'region' with your Amazon Cognito Region.
      clientConfig: { region: "us-east-1" }
    }),
  });

  const getSignedImageUrl = async (key: string) => {
    const command = new GetObjectCommand({ Bucket: "weddingsnapshot", Key: key });
    const signedUrl = await getSignedUrl(S3client, command, { expiresIn: 3600 });
    return signedUrl;
  }

  const getS3Object = async ({ key }: { key: string }) => {
    try {
      const signedUrl = await getSignedImageUrl(key);
      setSelectedImage({ uri: signedUrl });
    } catch (error) {
      if (error instanceof NoSuchKey) {
        console.error(`No such key: ${key}`);
      } else if (error instanceof S3ServiceException) {
        console.error(`S3 Service Exception: ${error.message}`);
      } else {
        console.error(`Error fetching S3 object: ${error}`);
      }
    }
  };

  const lastObject = () => {
    const currentIndex = objects.findIndex(obj => obj.Key === selectedObject?.Key);
    const lastIndex = (currentIndex - 1 + objects.length) % objects.length;
    const lastObject = objects[lastIndex];
    setSelectedObject(lastObject);
    getS3Object({ key: lastObject.Key as string });
  };

  const nextObject = () => {
    const currentIndex = objects.findIndex(obj => obj.Key === selectedObject?.Key);
    const nextIndex = (currentIndex + 1) % objects.length;
    const nextObject = objects[nextIndex];
    setSelectedObject(nextObject);
    getS3Object({ key: nextObject.Key as string });
  };

  useEffect(() => {    
    const command = new ListObjectsCommand({ Bucket: "weddingsnapshot" });
    S3client.send(command).then(({ Contents }) => {setObjects(Contents || [])});    
  }, []);

  useEffect(() => {    
    const displayImage = async () => {
      if (objects.length > 0) {
        const firstObject = objects[0];
        if (firstObject && firstObject.Key) {
          await getS3Object({ key: firstObject.Key });
        }
      }
    }
    displayImage();    
  }, []);

  if (objects.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Aucun objet trouvé dans le bucket S3.</Text>
        <IconButton icon="refresh" label="Rafraîchir" onPress={() => lastObject()} />
      </View>
    )};

  return (    
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer
          imgSource={PlaceholderImage}
          selectedImage={selectedImage && typeof selectedImage === 'object' && 'uri' in selectedImage ? selectedImage.uri : undefined}
        />
        <Text style={styles.message}>
          {selectedObject ? `Image: ${selectedObject.Key}` : 'Aucune image sélectionnée'}
        </Text>
      </View>
      
      <View style={styles.footerContainer}>
        <IconButton icon="keyboard-double-arrow-left" label="Précédent" onPress={() => lastObject()} />
        <IconButton icon="keyboard-double-arrow-right" label="Suivant" onPress={() => nextObject()} />
      </View>
    </View>
  );
}

export default  Images;