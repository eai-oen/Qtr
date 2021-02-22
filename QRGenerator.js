import React from 'react';
import { Platform, Button, StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

//import DocumentPicker from 'react-native-document-picker';

const windowWidth = Dimensions.get('window').width;

export default class SenderScreen extends React.Component {
  state = {
    data: null,
    fileLoaded: true,
    fileExtension: 'jpg',
    fileData: null,
    qrdata: "initial",
    path: null,  
  };
 
  sendWhichBlock = -1;
  sourceBlocks = null;
  sourceBlockNum = -1;

  async componentDidMount() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
  }

  componentWillUnmount() {
    clearInterval(this.qrInterval);
  }

  padl(x, target) {
    if (x.length != target) {
      let difference = target - x.length;
      x = "0".repeat(difference) + x;
    }
    return x
  }

  padr(x, target) {
    if (x.length != target) {
      let difference = target - x.length;
      x += "0".repeat(difference);
    }
    return x
  }

  soliton_distribution(i, k){
    if (i == 1) return 1 / k;
    return 1 / (i * (i - 1));
  }

	createSourceBlocks(){
		if (this.state.fileLoaded == false) return null;

		let bytesPerBlock = 1500;	
    let file_enc = this.state.fileData;

		let blocks = [];
		let totalbytes = file_enc.length;
		let totalblocks = Math.ceil(totalbytes/bytesPerBlock) + 1;


		// the first block encodes the file extension
		let fileExt = this.state.fileExtension;
    let block = fileExt + "+" + totalbytes.toString() + "+";
		blocks.push(this.padr(block, bytesPerBlock));

		// the rest of the blocks
		for (let i = 1; i < totalblocks; i++){
      block = file_enc.slice((i - 1) * bytesPerBlock, i * bytesPerBlock);
			blocks.push(this.padr(block, bytesPerBlock));
		}

		this.sourceBlocks = blocks;
		this.sourceBlockNum = totalblocks;
		this.sendWhichBlock = 0;	

		this.qrInterval = setInterval( ()=>this.sendOneEncodedBlock() , 100);
	}

	sendOneEncodedBlock(){
	  // k is the maximum number of source blocks a block could have
	  let k = 5; 

	  // d is the number of source blocks this encoded block should contain
	  // It shuold be randomly assigned according to the solition distribution
	  let sample = Math.random();
	  let cdf = 0;
    let d = null;
	  for (let i = 1; i <= k; i++){
	  	cdf += this.soliton_distribution(i, k);
	    if (sample < cdf || i == k){
	      d = i;
	      break;
	    }
	  }

	  // Create Header: (number of blocks total, 8 chars)(d, 1 char)(indicies of xored blocks, (d * 8) chars)
	  let header = this.padl(this.sourceBlockNum.toString(), 8);
	  header += d.toString(); // 1 <= d <= 5
	  let inds = new Set();
	  while (inds.size < d){inds.add(Math.floor(Math.random() * this.sourceBlockNum));}
    inds = Array.from(inds.keys());
    for (let idx of inds) {
      header += this.padl(idx.toString(), 8);
    } 

	  // xor the d source blocks together	  
	  let blocks = new Array(d).fill(null);
    for (let i = 0; i < d; i++) {
      blocks[i] = this.sourceBlocks[inds[i]];
    }
    blocks = blocks.reduce(xorStrings);
    header += btoa(blocks);

    // display the new qr data
	  this.setState({ qrdata: header });
	}

  // activates Document/Image picker and stores file content
  // into state.fileData with base64 encoding
  async pickFile(isImage) {
    this.setState({fileLoaded: false});

    let data = null, success = false;
    if (isImage) {
      data = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All
      });
      success = (data.cancelled === false);
    } else {
      data = await DocumentPicker.getDocumentAsync();
      success = (data.type === "success");
    }

    if (success) {
      const uri = data.uri;
      const content = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});
      await this.setState({path: uri, fileData: content, fileLoaded: true, fileExtension: uri.substring(uri.lastIndexOf('.'))})

      this.createSourceBlocks();
    }
  }

  render() {
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <View style={{marginTop: 20, justifyContent: 'center'}}>
          <QRCode value={this.state.qrdata} size={windowWidth - 40}/>
        </View>

        <View style={{
          height: 150, 
          position: 'absolute', 
          top: '65%', 
          width: '90%', 
          justifyContent: 'space-around',
          borderWidth: 2,
          borderRadius: 5,
          borderColor: '#4d5d6b',
        }}>
          <View style={{flex: 1, justifyContent: 'center', alignSelf: 'center'}}>
            <Text style={{fontFamily: 'Avenir', fontSize: 20}}>Upload...</Text>
          </View>
          <View style={{
            flex: 1, 
            flexDirection: 'row', 
            borderTopWidth: 1, 
            alignItems: 'center', 
            justifyContent: 'space-around',
            borderTopColor: '#c2cad1'
          }}>
            <Button title="Image" onPress={() => this.pickFile(true)}/>
            <Button title="File" onPress={() => this.pickFile(false)}/>
          </View>
        </View>
      </View>
    );
  }
}



const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

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