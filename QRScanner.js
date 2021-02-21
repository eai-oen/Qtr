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
    nreceived: null,       // Bytes buffer
    ereceived: null,       // Bytes buffer
  }
  state = {
    hasPermission: null,
    scanned: 0,
    scanning: true,
    loaded: false,
    nreceived: null,    // number of blocks received
    ereceived: null,    // number of blocks expected
    cachedFilePath: null,
  }


  bytes_to_number(bytes){
    console.log("GOT HERE");
    console.log("Received string of length " + bytes.length);
  	let p2 = 1, res = 0;
    for(let ind = 0; ind < bytes.length; ind++){
      console.log(bytes.charCodeAt(ind));
      res += p2 * bytes.charCodeAt(ind);
      p2 *= 256;
    }
  	return res;
  }

  async componentDidMount() {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    this.setState({hasPermission: status === "granted"});
  }

  parse = (s) => {
    if(!this.buffers.scanning) {return}
    console.log("SCANNED STRING LENGTH " + s.length + " WITH TYPE " + typeof(s));
    let bnumber = this.bytes_to_number(s.slice(0, 4)); 
    let total = this.bytes_to_number(s.slice(4, 8)); 
    console.log("Block Number: " + bnumber);
    console.log("Total Blocks: " + total);
    let data = s.slice(8);
    
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
    }
    
    // End logic
    if(this.buffers.nreceived === this.buffers.ereceived){
      console.log("Received all blocks")
      this.setState({scanning: false, loaded: true});
      this.buffers.scanning = false;
      this.buffers.loaded = true;
      
      let extension = Base64.btoa(this.buffers.buffer[0]);
      console.log("Extension: " + extension);
      
      this.processFile(this.buffers.buffer.slice(1).join())
    }
  }

  qrscanned = (result) => {
    console.log(result);
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
        <Text>Scanner Screen</Text>
        <Text>Number scanned overall: {this.state.scanned}</Text>
        <Text>Received {this.state.nreceived} out of {this.state.ereceived} codes. Loaded: {this.state.loaded.toString()}</Text>
      </View>
    )
  }
}


const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const Base64 = {
  btoa: (input = '')  => {
    let str = input;
    let output = '';

    for (let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

      charCode = str.charCodeAt(i += 3/4);

      if (charCode > 0xFF) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      
      block = block << 8 | charCode;
    }
    
    return output;
  },

  atob: (input = '') => {
    let str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);

      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  }
};
