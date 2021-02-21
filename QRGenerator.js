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

  soliton_distribution(i, k){
    if (i == 1) return 1/k;
    return 1/(i*(i-1));
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

		setInterval( ()=>this.sendOneEncodedBlock() , 100);
	}

	sendOneBlock(){
		var index = this.sendWhichBlock;
		this.setState({ qrdata: this.sourceBlocks[index]});
		this.sendWhichBlock = (index + 1) % this.sourceBlockNum;
	}


	sendOneEncodedBlock(){


		console.log("encoding");

	  // k is the maximum number of source blocks a block could have
	  let k = 5; 

	  // d is the number of source blocks this encoded block should contain
	  // it shuold be randomly assigned according to the solition distribution
	  let d = Math.random();
	  let sum = 0;
	  for (var i=1; i<=k; i++){
	  	sum += this.soliton_distribution(i, k);
	    if (d < sum){
	      d = i;
	      break;
	    }
	  }

	  console.log("d: ");
	  console.log(d);

	  let n = this.sourceBlocks.length;  // the total number of source Blocks
	  
	  // construct headers
	    // first char: d
	    // every 8 char after that: index of the pic
	  let header = d.toString();
	  let inds = [];
	  for (var i=0; i<d; i++){
	    let ind = Math.floor(Math.random() * n);
	    inds.push(ind);
	    header += this.pad(ind.toString());
	  }

	  console.log("header: ");
	  console.log(header);

	  // xor d source blocks together	  
	  let data = []
	  for (var i=0; i<d; i++){
	    let block = atob(this.sourceBlocks[inds[i]]);	// basse64string => 256 string
	    for (var j=0; j<block.length; j++){
	      if (data[j] == undefined) data[j] = 0;
	      data[j] = data[j] ^ block.charCodeAt(j);
	    }

	    console.log("data: ");
	    console.log(data);
	  }

	  // append the xors into the header
	  for (var i=0; i<data.length; i++)
	  	header += String.fromCharCode(data[i]);

	  //return header;
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




