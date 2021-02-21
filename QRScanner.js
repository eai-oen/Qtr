import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export default class ScannerScreen extends React.Component {
  state = {
    hasPermission: null,
    scanned: false,
    data: "nodata",
    cachedFilePath: null,
  }

  async componentDidMount() {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    this.setState({hasPermission: status === "granted"});
  }

  async saveImage() {
    await MediaLibrary.saveToLibraryAsync(this.state.filepath);
  }

  async processImage(base64string, fileExtension) {
    const filepath = FileSystem.cacheDirectory + "qrt_file" + fileExtension;
    await FileSystem.writeAsStringAsync(filepath, base64string, {encoding: FileSystem.EncodingType.Base64});
    this.setState({cachedFilePath: filepath});

    Sharing.shareAsync(filepath);
  }

  handleBarCodeScanned = ({ type, data }) => {
    this.setState({scanned: true});
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    this.setState({data: data })
  }

  render() {
    if (this.state.hasPermission === null) 
      return <Text>Requesting for camera permission</Text>;
    if (this.state.hasPermission === false) 
      return <Text>No access to camera</Text>;

    return (
      <View style={{flex: 1}}>
        <BarCodeScanner
          onBarCodeScanned={this.state.scanned ? undefined : this.handleBarCodeScanned }
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text>Scanner Screen</Text>

        <Text> {this.state.data} is the data </Text>

      </View>
    )
  }
}


