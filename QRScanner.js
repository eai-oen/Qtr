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

  decodedSourceBlocks = {
    length: -1,
    data: []
  };

  encodedBlocks = [];

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



/* 
decodedSourceBlocks = {
  length: -1
  data: [ [], [], [], ...  ]
}
  the final list of decoded source blocks

encodedBlocks = [ {
  inds: [12, 32],
  data: [......]
}, {}, ... ]
  the encoded blocks that consists of more than 1 undecoded source blocks


function string_to_bytes(str){
  let res = [];
  for (var i=0; i<str.length; i++)
    res.push(str.charCodeAt(i));
  return res;
}

*/


function updateEncodedBlocks(){

  this.encodedBlocks.forEach((val, ind) => {
    
  });

  var n = this.encodedBlocks.length;
  for (var i=0; i<n; i++){
    var encB = this.encodedBlocks[i];
    for (var j=0; j<encB.inds.length; j++){

    }
  }
}

function decodeOneBlock(blockData){
  // asusming blockData is a string

  // get header data
    // first byte: d
    // every 8 bytes after that: index of the source block
  let d = parseInt(blockData[0]);
  let inds = [];
  for (var i=0; i<d; i++)
    inds.push( parseInt(blockData.slice(1+i*8, 1+(i+1)*8)) );

  console.log('ok i read d: ');
  console.log(d);
  console.log('and index ');
  console.log(inds);

  // this is the main data; store it as number in bytes
  let dataStr = blockData.slice(1+d*8);
  let data = [];
  for (var i=0; i<dataStr.length; i++)
    data.push(dataStr.charCodeAt(i));



  // see if any of the decode source blocks can
  // xor away some contents
  for (var i=0; i<d; i++){
    if (inds[i] <= this.decodedSourceBlocks.length
       && this.decodedSourceBlocks.data[inds[i]] != null){
      var dSB = this.decodedSourceBlocks.data[inds[i]];

      for (var j=0; j<dSB.length; j++)
        data[j] = dSB[j] ^ data[j];

      inds.splice(i, 1);
    }
  }


  // add it to the decoded blocks if it only has 1 block left
  if (inds.length == 1){
    // x is the current largest index in the decoded blocks
    var x = this.decodedSourceBlocks.length;
    if (x < inds[0]){
      // update the decoded source blocks array up
      // to inds[0], which is wheere this source block goes
      for (let i=x+1; i<=inds[0]; i++)
        this.decodedSourceBlocks.data.push(null);
      this.decodedSourceBlocks.length = index;
    }

    this.decodedSourceBlocks.data[index] = content;

    // we run over all the encoded blocks to see if 
    // there are any old fellas going in the 
    // decoded source pile
    updateEncodedBlocks();
  }

  else if (inds.length > 1){
    this.encodedBlocks.push({
        inds: inds,
        data: data
    });
  }


}