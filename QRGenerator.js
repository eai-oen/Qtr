import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function SenderScreen(props) {
  return (
    <View>
      <Text>Sender Screen</Text>
      <QRCode
        value="Minato Aqua"
      />
    </View>
  )
}