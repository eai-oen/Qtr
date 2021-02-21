import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { enableScreens } from 'react-native-screens';


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
      if(bnumber === 0) {
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
      let hold = this.buffers.buffer.slice(1).join();
      console.log("Received length: " + hold.length);
      this.processFile(hold, extension);
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

    let scanStatus = "Searching for File...", percentage = 0;
    if (this.state.ereceived !== "???") {
      percentage = this.state.nreceived / this.state.ereceived * 100;

      if (percentage < 100)
        scanStatus = "Receiving....(" + this.state.nreceived.toString() + "/" + this.state.ereceived.toString() + ")";
      else
        scanStatus = "File received"
    }

    return (
      <View style={{flex: 1}}>
        <View style={{height: 30, width: '100%'}}>
          <View style={{position: 'absolute',  height: 30, width: percentage.toString() + "%", backgroundColor: '#c2cad1'}}/>
          <Text style={{flex: 1, alignSelf: 'center', justifyContent: 'center'}}>{scanStatus}</Text>
        </View>
        <BarCodeScanner
          onBarCodeScanned={ this.qrscanned }
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          style={{flex: 1}}
          />
      </View>
    )
  }
}