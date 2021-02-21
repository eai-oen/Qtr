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

  pad(x) {
    while(x.length != 8) { x = "0" + x;}
    return x;
  }

	createSourceBlocks(){
		if (this.state.fileLoaded == false) return null;

		let bytesPerBlock = 1500;	
    let file_enc = this.state.fileData;

		let blocks = [];
		let totalbytes = file_enc.length;
		let totalblocks = Math.ceil(totalbytes/bytesPerBlock) + 1;
		let totalblocks_enc = this.pad(totalblocks.toString());
    console.log("Number of blocks: " + totalblocks);
    console.log("Length of file: " + totalbytes);


		// the first block encodes the file extension
		let fileExt = this.state.fileExtension;
    let block = this.pad("0") + totalblocks_enc + fileExt;
		blocks.push(block);

		// the rest of the blocks
		for (let i = 1; i < totalblocks; i++){
			block = this.pad(i.toString()) + totalblocks_enc;
      block += file_enc.slice((i - 1) * bytesPerBlock, i * bytesPerBlock);
			blocks.push(block);
		}

		this.sourceBlocks = blocks;
		this.sourceBlockNum = totalblocks;
		this.sendWhichBlock = 0;	

		this.qrInterval = setInterval( ()=>this.sendOneBlock() , 100);
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

    let data = null, success = false;
    if (isImage) {
      data = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All
      });
      success = (data.cancelled === "false");
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
