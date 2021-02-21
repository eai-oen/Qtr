import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import ScannerScreen from './QRScanner';
import SenderScreen from './QRGenerator';

import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

function HomeScreen(props) {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Button 
        title="Go to Scanner"
        onPress={() => props.navigation.navigate('Scanner')}
      />
      <Button 
        title="Go to Sender"
        onPress={() => props.navigation.navigate('Sender')}
      />

      

    </View>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="Sender" component={SenderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
