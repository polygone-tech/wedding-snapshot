import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  imgSource: ImageSourcePropType;
  selectedImage?: string;
};

const  ImageViewer = ({ imgSource, selectedImage }: Props) => {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;
  const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={imageSource}
        placeholder={{ blurhash }}
        contentFit="contain"
        transition={1000}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 350,
    height: 680,
  },
});

export default ImageViewer;