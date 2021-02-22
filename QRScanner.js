import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';


export default class ScannerScreen extends React.Component {
  state = {
    hasPermission: null,
    scanned: 0,
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
    // Decode Header: (number of blocks total, 8 chars)(d, 1 char)(indicies of xored blocks, (d * 8) chars)
    if(this.sourceBlockNum === null){
      this.sourceBlockNum = parseInt(blockData.slice(0, 8));
      this.setState({ereceived: this.sourceBlockNum});
      this.decodedSourceBlocks = new Array(this.sourceBlockNum).fill(null);
    }
    let d = parseInt(blockData[8]);
    let inds = new Set();
    for (var i=0; i<d; i++)
      inds.add( parseInt(blockData.slice(9 + i * 8, 17 + i * 8)) );
  
    // Slice off the main data and decode from Base64 transfer format
    let dataStr = atob(blockData.slice(9+d*8));
  
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
    do {
      runAgain = false;
      this.setState({scanned: this.encodedBlocks.length});
      for(let encidx = this.encodedBlocks.length - 1; encidx >= 0; encidx--){
        let encB = this.encodedBlocks[encidx]
        let removal = [];
        for(let idx of encB.xord.values()) {
          if (this.decodedSourceBlocks[idx] !== null){ // if one of the indices is solved
            encB.data = xorStrings(this.decodedSourceBlocks[idx], encB.data); // xor this shit out
            removal.push(idx); // delete this index
          }
        }
        for(let hold of removal) { encB.xord.delete(hold); } // remove designated items from xored set
    
        // delete it from encoded if completely empty
        if (encB.xord.size === 0){
          this.encodedBlocks.splice(encidx, 1);
        }
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
            this.setState({nreceived: this.blocksDecoded});
            console.log("Decoded so far: " + this.blocksDecoded);
          }
  
        }
      }
    } while(runAgain);
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
    
    // this.setState((state) => ({scanned: state.scanned + 1}));
  }
  
  async processFile(base64string, fileExtension) {
    const filepath = FileSystem.cacheDirectory + "qtr_file" + fileExtension;
    await FileSystem.writeAsStringAsync(filepath, base64string, {encoding: FileSystem.EncodingType.Base64});
    this.setState({cachedFilePath: filepath});

    try {
      await MediaLibrary.saveToLibraryAsync(filepath);
    } catch (error) {}

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
        scanStatus = "Receiving(" + this.state.nreceived.toString() + "/" + this.state.ereceived.toString() + ")";
      else
        scanStatus = "File received"

      scanStatus += "; Scanned " + this.state.scanned.toString();
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

function xorStrings(a, b){
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