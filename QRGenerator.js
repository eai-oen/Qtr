import React from 'react';
import { Platform, Button, StyleSheet, Text, View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

//import DocumentPicker from 'react-native-document-picker';

export default class SenderScreen extends React.Component {
  state = {
    data: null,
    base64: "fuck",
    status: "choose",
    path: null,
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
      base64: true,
    });

    this.setState({data: result});  
    console.log(result.base64.substring(0, 100));
    this.setState({status: "loading"});

    const extension = result.uri.substring(result.uri.lastIndexOf('.'));
    const filepath = FileSystem.cacheDirectory + "myfile" + extension;

    await FileSystem.writeAsStringAsync(filepath, result.base64, {encoding: FileSystem.EncodingType.Base64});

    this.setState({status: "loaded", path: filepath});
    console.log(this.state.path + " has been created ");
    
    await MediaLibrary.saveToLibraryAsync(filepath);
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