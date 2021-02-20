import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
//import DocumentPicker from 'react-native-document-picker';

export default class SenderScreen extends React.Component {
  state = {
    data: null
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
    });

    this.setState({data: result});  
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
          title="Get File"
          onPress={() => this.getImage()}
        />
        <Text>{this.state.data ? this.state.data.size + " " + this.state.data.uri : "Lmao" }</Text>
      </View>
    );
  }
}