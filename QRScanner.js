import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { EMaskUnits } from 'react-native-svg';


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

  decodedSourceBlocks = null;
  encodedBlocks = [];
  sourceBlockNum = null;
  blocksDecoded = 0;
  prevrece = null;
  scanning = true;

  finalize(){
    this.scanning = false;
    let hold = this.decodedSourceBlocks[0].split("+");
    let extension = hold[0];
    let numbytes = parseInt(hold[1]);
    let buffer = this.decodedSourceBlocks.slice(1).join("");
    buffer = buffer.slice(0, numbytes);
    console.log("RECV length: " + buffer.length);
    console.log("EXPD length: " + numbytes);
    console.log("EXT: " + extension);
    this.processFile(buffer, extension);
  }

  decodeOneBlock(blockData){
    // asusming blockData is a string
  
    // get header data
    // first byte: d
    // every 8 bytes after that: index of the source block
    if(this.sourceBlockNum === null){
      this.sourceBlockNum = parseInt(blockData.slice(0, 8));
      this.decodedSourceBlocks = new Array(this.sourceBlockNum).fill(null);
    }
    let d = parseInt(blockData[8]);
    let inds = new Set();
    for (var i=0; i<d; i++)
      inds.add( parseInt(blockData.slice(9+i*8, 17+i*8)) );
  
    // this is the main data; store it as number in bytes
    let dataStr = blockData.slice(9+d*8);
    dataStr = atob(dataStr);
  
    this.encodedBlocks.push({
      xord: inds,
      data: dataStr
    });
    this.updateEncodedBlocks();
    if(this.blocksDecoded == this.sourceBlockNum) {
      this.finalize();
    }
  }

  updateEncodedBlocks(){
    let runAgain = false;
    for(let encidx = this.encodedBlocks.length - 1; encidx >= 0; encidx--){
      let encB = this.encodedBlocks[encidx]
      let removal = [];
      for(let idx of encB.xord.values()) {
        if (this.decodedSourceBlocks[idx] != null){ // if one of the indices is solved
          encB.data = this.xorStrings(this.decodedSourceBlocks[idx], encB.data); // xor this shit out
          removal.push(idx); // delete this index
        }
      }
      for(let hold of removal) { encB.xord.delete(hold); } // remove designated items from xored set
  
      // if all but 1 is xor'd out, we move it to decoded
      if (encB.xord.size === 1){
        // delete it from encoded
        let ind = Array.from(encB.xord.values())[0];
        console.log("decoded block num " + ind);
        this.encodedBlocks.splice(encidx, 1);
        if (this.decodedSourceBlocks[ind]===null){
          // ind is the ssource block index we want to add to  

          runAgain = true;
          this.decodedSourceBlocks[ind] = encB.data;
          this.blocksDecoded++;
          console.log("Decoded so far: " + this.blocksDecoded);
        }

      }
    }
  
    // if there are new blocks added to source
    // we should check the encoded blocks again
    if (runAgain){
      this.updateEncodedBlocks();
    }
  }

  xorStrings(a, b){
    let s = '';
  
    // use the longer of the two words to calculate the length of the result
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      // append the result of the char from the code-point that results from
      // XORing the char codes (or 0 if one string is too short)
      s += String.fromCharCode(
        (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
      );
    }
  
    return s;
  }

  async componentDidMount() {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    this.setState({hasPermission: status === "granted"});
  }

  qrscanned = (result) => {
    if(!this.scanning){
      return;
    }
    if(this.prevrece !== result.data) {
      this.decodeOneBlock(result.data);
      this.prevrece = result.data;
    }
    
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


const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function atob (input = ''){
  let str = input.replace(/[=]+$/, '');
  let output = '';

  if (str.length % 4 == 1) {
    throw new Error(
      "'atob' failed: The string to be decoded is not correctly encoded.",
    );
  }
  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
}

function btoa(input = ''){
  let str = input;
  let output = '';

  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));

    if (charCode > 0xff) {
      throw new Error(
        "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.",
      );
    }

    block = (block << 8) | charCode;
  }

  return output;
}