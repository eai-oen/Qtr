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


  bytes_to_number(arr){
  	var p2 = 1, res = 0;
  	arr.forEach((val, ind) => {
  		res += p2 * val;
  		p2 *= 256;
  	});
  	return res;
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
		let bytesPerBlock = 2000;	
		var data = atob(this.state.fileData);

		var blocks = [];
		var n = data.length;
		var m = Math.ceil(n/bytesPerBlock);
		var mb8 = this.number_to_bytes(m);

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

  async getFile() {
    const result = await DocumentPicker.getDocumentAsync();
    this.setState({data: result});
    console.log(result);


  }

  async componentDidMount() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
    }
  }

  async getImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      base64: true,
    });
    console.log("got the file");
    this.setState({fileData: result.base64});
    this.createSourceBlocks();
  }
  async pickImage() {
    this.setState({fileLoaded: false});
    // const { uri, base64 } = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.All,
    //   base64: true,
    // });

    const { uri } = await DocumentPicker.getDocumentAsync();
    let base65 = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});

    // this.setState({
    //   fileLoaded: true,
    //   fileData: base64,
    //   fileExtension: uri.substring(uri.lastIndexOf('.')),
    // });

    let filepath = FileSystem.cacheDirectory + "qrt_file" + uri.substring(uri.lastIndexOf('.'));
    await FileSystem.writeAsStringAsync(filepath, base65, {encoding: FileSystem.EncodingType.Base64});
    this.setState({path: filepath});
    // let filepath2 = await FileSystem.getContentUriAsync(filepath)

    // this.setState({cachedFilePath: filepath});
    await Sharing.shareAsync(filepath);
    //this.setState({dd: "im done"});
  }

  render() {

  	console.log(this.state.qrdata);

    return (
      <View>
        <Text>Sender Screen</Text>
        

        <QRCode
              value={
              	[this.state.qrdata]
              }
              size={400}
         />

        <Button
          title="Get Image"
          onPress={() => this.pickImage()}
        />
        <Button
          title="Get File"
          onPress={() => this.getFile()}
        />
        <Text>{"Status: " + this.state.status}</Text>
        <Text>{this.state.data ? this.state.data.width + " " + this.state.data.height + " " + this.state.data.uri + " " + this.state.base64: "Lmao" }</Text>
        {this.state.path && 
          (<View>
             <Image 
              style={{height: 100, width: 100}}
              source={{uri: this.state.path}} 
            />
            <Text>image loaded with path {this.state.path}</Text>
           </View>)
            
        }
      </View>
    );
  }
}






