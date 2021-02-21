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
  // number_to_bytes(num, len=4){
  // 	var res = [];
  // 	for (var i=0; i<len; i++){
  // 		res.push(num%256);
  // 		num = Math.floor(num/256);
  // 	}
  // 	return res;
  // }
  pad(x) {
    while(x.length != 8) {
      x = "0" + x;
    }
    return x;
  }
  // Buffer.from(fileExt)
	createSourceBlocks(){
		if (this.state.fileLoaded == false) return null;

		let bytesPerBlock = 30;	
    let file_enc = this.state.fileData;

    console.log("PEEN");
		let blocks = [];
    console.log("PEEN");
		let totalbytes = file_enc.length;
    console.log("PEEN");
		let totalblocks = Math.ceil(totalbytes/bytesPerBlock) + 1;
    console.log("PEEN");
		let totalblocks_enc = this.pad(totalblocks.toString());
    console.log("PEEN");
    console.log("Number of blocks: " + totalblocks);
    console.log("PEEN");


		// the first block encodes the file extension
    console.log(this.state.fileExtension);
		let fileExt = this.state.fileExtension;
    let block = this.pad("0") + totalblocks_enc + fileExt;
		blocks.push(block);

		// the rest of the blocks
		for (let i = 1; i < totalblocks; i++){
			block = this.pad(i.toString()) + totalblocks_enc;
      if (i == 0){
        console.log(block.length);
      } 
      block += file_enc.slice(i * bytesPerBlock, (i + 1) * bytesPerBlock);
			blocks.push(block);
		}

		this.sourceBlocks = blocks;
		this.sourceBlockNum = totalblocks;
		this.sendWhichBlock = 0;	

		setInterval( ()=>this.sendOneBlock() , 600);
	}

	sendOneBlock(){
		var index = this.sendWhichBlock;
		this.setState({ qrdata: this.sourceBlocks[index]});
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

    this.createSourceBlocks();
  }

  render() {

    return (
      <View>
        <Text>Sender Screen</Text>
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <QRCode value={this.state.qrdata} size={350}/>
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
