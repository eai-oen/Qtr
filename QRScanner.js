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

// goes through the encodedBlocks and
// checks to see if we can
// resolve any to the decodedSourceBlocks
function updateEncodedBlocks(){

  let runAgain = false;

  this.encodedBlocks.forEach((encB, i) => { // for every encoded block
    encB.inds.forEach((ind, j) => {   // look at the indices it xors together
      if (ind <= this.decodedSourceBlocks.length &&
        this.decodedSourceBlocks.data[ind] != null){ // if one of the indices is solved

        // xor this shit out
        this.decodedSourceBlocks.data[ind].forEach((byte, k) => {
          encB.data[k] = encB.data[k] ^ byte;
        });

        // delete this index
        encB.inds.splice(j, 1);
      }
    });

    // if all but 1 is xor'd out, we move it to decoded
    if (encB.inds.length == 1){
      runAgain = true;

      

      // x is the current largest index in the decoded blocks
      let x = this.decodedSourceBlocks.length; 

      // ind is the ssource block index we want to add to  
      let ind = encB.inds[0];

      // add it to decoded
      for (let k=x+1; k<=ind; k++)
        this.decodedSourceBlocks.data.push(null);
      this.decodedSourceBlocks.data[ind] = encB.data;

      this.decodedSourceBlocks.length = Math.max(x, ind);

      // delete it from encoded
      this.encodedBlocks.splice(i, 1);

      
    }

  });

  // if there are new blocks added to source
  // we should check the encoded blocks again
  if (runAgain){
    this.updateEncodedBlocks();
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
  console.log('and indexes ');
  console.log(inds);

  // this is the main data; store it as number in bytes
  let dataStr = blockData.slice(1+d*8);
  let data = [];
  for (var i=0; i<dataStr.length; i++)
    data.push(dataStr.charCodeAt(i));


  this.encodedSourceBlocks.push({
    inds: inds,
    data: data
  });
  

  this.updateEncodedBlocks();

}