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

  pad(x) {
    while(x.length != 8) { x = "0" + x;}
    return x;
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
		let totalblocks_enc = this.pad(totalblocks.toString());
    console.log("Number of blocks: " + totalblocks);
    console.log("Length of file: " + totalbytes);


		// the first block encodes the file extension
		let fileExt = this.state.fileExtension;
    let block = fileExt + "/" + totalbytes.toString() + "/";
		blocks.push(this.padr(block, bytesPerBlock));

		// the rest of the blocks
		for (let i = 1; i < totalblocks; i++){
      block = file_enc.slice((i - 1) * bytesPerBlock, i * bytesPerBlock);
			blocks.push(this.padr(block, bytesPerBlock));
		}

		this.sourceBlocks = blocks;
		this.sourceBlockNum = totalblocks;
		this.sendWhichBlock = 0;	

		setInterval( ()=>this.sendOneEncodedBlock() , 100);
	}

	sendOneBlock(){
		var index = this.sendWhichBlock;
		this.setState({ qrdata: this.sourceBlocks[index]});
		this.sendWhichBlock = (index + 1) % this.sourceBlockNum;
	}

  xorStrings(a, b){
  	a = atob(a);
  	b = atob(b);
    let s = '';
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      s += String.fromCharCode(
        (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
      );
    }
  
    return s;
  }

	sendOneEncodedBlock(){
	  // k is the maximum number of source blocks a block could have
	  let k = 5; 

	  // d is the number of source blocks this encoded block should contain
	  // it shuold be randomly assigned according to the solition distribution
	  let sample = Math.random();
	  let cdf = 0;
    let d = null;
	  for (let i=1; i<=k; i++){
	  	cdf += this.soliton_distribution(i, k);
	    if (sample < cdf || i == k){
	      d = i;
	      break;
	    }
	  }

	  // construct headers
    // first char: d
    // every 8 char after that: index of the pic
	  let header = this.pad(this.sourceBlockNum);
	  header += d.toString();
	  let inds = new Set();
	  while (inds.size < d){inds.add(Math.floor(Math.random() * this.sourceBlockNum));}
    inds = Array.from(inds.keys());
    for (let idx of inds) {
      header += this.pad(idx.toString());
    } 

	  // console.log("header: " + header);

	  // xor d source blocks together	  
	  let blocks = new Array(d).fill(null);
    for (let i = 0; i < d; i++) {
      blocks[i] = this.sourceBlocks[inds[i]];
    }
    header += blocks.reduce(this.xorStrings);

	  this.setState({ qrdata: header });
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




