import React from 'react';
import { Platform, Button, StyleSheet, Text, View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

//import DocumentPicker from 'react-native-document-picker';

export default class SenderScreen extends React.Component {
  state = {
    data: null,
    base64: "fuck",
    status: "choose",
    path: null,
    message: "0030asdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsf",
    blockno: 0,

    fileLoaded: false,
    fileExtension: null,
    fileData: null
  }
  async getFile() {
    const result = await DocumentPicker.getDocumentAsync();
    this.setState({data: result});
    console.log(result);
  }

  pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }


  async componentDidMount() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
    setInterval(() => { this.setState(
      (state) => ({
        message: this.pad(state.blockno, 2) + "30asdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsfasdfasdfasdfasdfadsf",
        blockno: state.blockno == 30 ? 0 : state.blockno + 1,
    })) }, 100)
  }

  async pickImage() {
    this.setState({fileLoaded: false});
    const { uri, base64 } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      base64: true,
    });

    // const { uri } = await DocumentPicker.getDocumentAsync();
    let base65 = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});

    // this.setState({
    //   fileLoaded: true,
    //   fileData: base64,
    //   fileExtension: uri.substring(uri.lastIndexOf('.')),
    // });

    let filepath = FileSystem.cacheDirectory + "qtr_file" + uri.substring(uri.lastIndexOf('.'));
    await FileSystem.writeAsStringAsync(filepath, base65, {encoding: FileSystem.EncodingType.Base64});
    this.setState({path: filepath});
    // let filepath2 = await FileSystem.getContentUriAsync(filepath)

    // this.setState({cachedFilePath: filepath});
    await Sharing.shareAsync(filepath);
    //this.setState({dd: "im done"});
  }

  render() {
    return (
      <View>
        <Text>Sender Screen</Text>
        <QRCode
          value={this.state.message}
          size={300}
        />
        <Button
          title="Get Image"
          onPress={() => this.pickImage()}
        />
        <Button
          title="Get File"
          onPress={() => this.getFile()}
        />
        <Text>{"Status: " + this.state.status}</Text>
        <Text>{this.state.data ? this.state.data.width + " " + this.state.data.height + " " + this.state.data.uri + " " + this.state.base64: "Lmao" }</Text>
        {this.state.path &&
          (<View>
             <Image
              style={{height: 100, width: 100}}
              source={{uri: this.state.path}}
            />
            <Text>image loaded with path {this.state.path}</Text>
           </View>)

        }
      </View>
    );
  }
}
