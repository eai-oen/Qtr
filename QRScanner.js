import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';


export default class ScannerScreen extends React.Component {
  buffers = {
    buffer: null,       // Bytes buffer
    scanning: true,
    loaded: false,
    nreceived: 0,       // Bytes buffer
    ereceived: "???",       // Bytes buffer
    extension: "???",
  }
  state = {
    hasPermission: null,
    scanned: 0,
    scanning: true,
    loaded: false,
    nreceived: 0,    // number of blocks received
    ereceived: "???",    // number of blocks expected
    extension: "???",
    cachedFilePath: null,
  }

  async componentDidMount() {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    this.setState({hasPermission: status === "granted"});
  }

  parse = (s) => {
    if(!this.buffers.scanning) {return}
    let bnumber = parseInt(s.slice(0, 8)); 
    let total = parseInt(s.slice(8, 16)); 
    let data = s.slice(16);
    
    // Init logic
    if(this.buffers.buffer === null) {
      this.setState({
        nreceived: 0, 
        ereceived: total, 
      });
      this.buffers.nreceived = 0;
      this.buffers.ereceived = total;
      this.buffers.buffer = new Array(total).fill(null);
    }
    
    // Add logic
    if(this.buffers.buffer[bnumber] === null) {
      console.log("Received block " + bnumber + " out of " + total)
      this.buffers.buffer[bnumber] = data;
      this.setState({nreceived: this.state.nreceived + 1});
      this.buffers.nreceived++;
      if(bnumber === 1) {
        this.setState({extension: data});
        this.buffers.extension = data;
      }
    }
    
    // End logic
    if(this.buffers.nreceived === this.buffers.ereceived){
      console.log("Received all blocks")
      this.setState({scanning: false, loaded: true});
      this.buffers.scanning = false;
      this.buffers.loaded = true;
      
      let extension = this.buffers.buffer[0];
      console.log("Extension: " + extension);
      
      this.processFile(this.buffers.buffer.slice(1).join())
    }
  }

  qrscanned = (result) => {
    this.parse(result.data);
    this.setState((state) => ({scanned: state.scanned + 1}));
  }
  
  async saveImage() {
    await MediaLibrary.saveToLibraryAsync(this.state.filepath);
  }

  async processFile(base64string, fileExtension) {
    const filepath = FileSystem.cacheDirectory + "qtr_file" + fileExtension;
    await FileSystem.writeAsStringAsync(filepath, base64string, {encoding: FileSystem.EncodingType.Base64});
    this.setState({cachedFilePath: filepath});

    await Sharing.shareAsync(filepath);
  }

  render() {
    if (this.state.hasPermission === null) 
      return <Text>Requesting for camera permission</Text>;
    if (this.state.hasPermission === false) 
      return <Text>No access to camera</Text>;

    return (
      <View style={{flex: 1}}>
        <BarCodeScanner
          onBarCodeScanned={ this.qrscanned }
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          style={StyleSheet.absoluteFillObject}
          />
        <Text>Scanner Info</Text>
        <Text>QR codes scanned overall: {this.state.scanned}</Text>
        <Text>Received {this.state.nreceived} out of {this.state.ereceived} codes.</Text>
        <Text>Loaded: {this.state.loaded.toString()}</Text>
        <Text>File Extension: {this.state.extension}</Text>
      </View>
    )
  }
}