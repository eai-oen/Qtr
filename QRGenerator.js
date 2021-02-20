import React from 'react';
import { Platform, Button, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

//import DocumentPicker from 'react-native-document-picker';

export default class SenderScreen extends React.Component {
  state = {
    data: null,
    base64: "fuck",
    status: "choose",
  }
  async getFile() {
    const result = await DocumentPicker.getDocumentAsync();
    this.setState({data: result});
    console.log(result);
  }

  async componentDidMount() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
  }

  async getImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    this.setState({data: result});  
    console.log(result.base64.substring(0, 100));
    this.setState({status: "loading"});
    const boi = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
    console.log(boi);

    const extension = result.uri.substring(result.uri.lastIndexOf('.'));
    await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + "myfile" + extension, 'data:image/png;base64,' + result.base64);
    //const contents = await FileSystem.readAsStringAsync(result.uri, {encoding: FileSystem.EncodingType.Base64})
    

    // You can also display the image using data:
    // const source = { uri: 'data:image/jpeg;base64,' + response.data };
    // const extension = result.uri.substring(result.uri.lastIndexOf('.'));
    // const imagePath = `${RNFS.DocumentDirectoryPath}/${new Date().toISOString()}`.replace(/:/g, '-') + extension;

    // if(Platform.OS === 'ios') {
    //   RNFS.copyAssetsFileIOS(result.uri, imagePath, 0, 0)
    //     .then(res => {
    //       console.log("successs");
    //     })
    //     .catch(err => {
    //       console.log('ERROR: image file write failed!!!');
    //       console.log(err.message, err.code);
    //     });
    // } 
    this.setState({status: "loaded"});

    // console.log(contents);
    // console.log("my dick");
    
    // console.log(extension);
    //await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + "myfile" + extension, 'data:image/jpg;base64,' + contents);
  }

  render() {
    return (
      <View>
        <Text>Sender Screen</Text>
        <QRCode
          value="Minato Aqua"
          size={300}
        />
        <Button
          title="Get Image"
          onPress={() => this.getImage()}
        />
        <Button
          title="Get File"
          onPress={() => this.getFile()}
        />
        <Text>{"Status: " + this.state.status}</Text>
        <Text>{this.state.data ? this.state.data.width + " " + this.state.data.height + " " + this.state.data.uri + " " + this.state.base64: "Lmao" }</Text>
      </View>
    );
  }
}