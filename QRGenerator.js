import React from 'react';
import { Platform, Button, StyleSheet, Text, View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

//import DocumentPicker from 'react-native-document-picker';


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

  // the bytes are read right to left
  number_to_bytes(num, len=4){
  	var res = [];
  	for (var i=0; i<len; i++){
  		res.push(num%256);
  		num = Math.floor(num/256);
  	}
  	return res;
  }

	createSourceBlocks(){

		console.log("creating source blocks");

		if (this.state.fileLoaded == false) return null;

		// header: 4 bytes for block index, 4 bytes for total # of blocks
		// content: 2000 bytes
		let bytesPerBlock = 1500;	
		let data = Base64.atob(this.state.fileData);

		let blocks = [];
		let n = data.length;
		let m = Math.ceil(n/bytesPerBlock);
		let mb8 = this.number_to_bytes(m);

		console.log("vars");
		console.log(mb8);
		console.log(m);
		console.log(n);

		// the first 0/m block encodes the file extension
		var fileExt = this.state.fileExtension;
		var block = this.number_to_bytes(0).concat(mb8);
		for (var i=0; i<fileExt.length; i++)
			block.push(fileExt.charCodeAt(i));
		blocks.push(block);

		console.log("first block only");
		console.log(blocks);

		// the rest of the blocks
		for (var i=0; i<m; i++){
			block = this.number_to_bytes(i).concat(mb8);
			for (var j=0; j<bytesPerBlock && i+j<n; j++)
				block.push(data.charCodeAt(i+j));
			blocks.push(block);
		}

		this.sourceBlocks = blocks;
		this.sourceBlockNum = m;
		this.sendWhichBlock = 0;	

		setInterval( ()=>this.sendOneBlock() , 1000);
	}


	sendOneBlock(){
		console.log("sending this");
		console.log(this.sendWhichBlock);


		var index = this.sendWhichBlock;
		console.log(this.sourceBlocks[index]);

		this.setState({
			qrdata: {
				data: this.sourceBlocks[index],
				mode: 'byte'
			}
		});

		this.sendWhichBlock = (index + 1) % this.sourceBlockNum;
	}

  
  // activates Document/Image picker and stores file content
  // into state.fileData with base64 encoding
  async pickFile(isImage) {
    this.setState({fileLoaded: false});

    let data = null;
    if (isImage) {
      data = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All
      });
    } else {
      data = await DocumentPicker.getDocumentAsync();
    }

    const uri = data.uri;
    const content = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});
    await this.setState({path: uri, fileData: content, fileLoaded: true, fileExtension: uri.substring(uri.lastIndexOf('.'))})

    console.log(this.state.fileData.substring(0,100));
    this.createSourceBlocks();
  }

  render() {

    return (
      <View>
        <Text>Sender Screen</Text>
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <QRCode value={[this.state.qrdata]} size={350}/>
        </View>
        <Button title="Get Image" onPress={() => this.pickFile(true)}/>
        <Button title="Get File" onPress={() => this.pickFile(false)}/>
        <Text>{"Status: " + this.state.status}</Text>
        <Text>{this.state.data ? this.state.data.width + " " + this.state.data.height + " " + this.state.data.uri + " " + this.state.base64: "Lmao" }</Text>
        {this.state.path && 
          (<View style={{justifyContent: 'center', alignItems: 'center'}}>
             <Image 
              style={{height: 100, width: 100, alignSelf: 'center'}}
              source={{uri: this.state.path}} 
            />
            <Text>image loaded with path {this.state.path}</Text>
           </View>)
            
        }
      </View>
    );
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