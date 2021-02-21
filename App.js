import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import ScannerScreen from './QRScanner';
import SenderScreen from './QRGenerator';

import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

function HomeScreen(props) {
  return (
    <View style={styles.container}>
      <View style={{
        borderWidth: 0,
        backgroundColor: '#1e81b0',
        height: "32%", 
        width: "62%", 
        borderRadius: 12, 
        position: 'absolute',
        top: '16%',
        left: '30%',
      }}/>
      <View style={{
        borderWidth: 0,
        backgroundColor: '#abdbe3',
        height: "29.5%", 
        width: "60.5%", 
        borderRadius: 12, 
        position: 'absolute',
        top: '21%',
        left: '22%',
      }}/>
      <View style={{
        borderWidth: 5,
        borderColor: '#ff9359',
        height: "32%", 
        width: "62%", 
        borderRadius: 12, 
        position: 'absolute',
        top: '11%',
        left: '12%',
      }}>
        <View style={{
          borderWidth: 2.5, 
          borderRadius: 5,
          height: "17.2%", 
          width: "17.2%", 
          position: 'absolute', 
          top: '80%',
          left: '81%',
          borderColor: '#ff9359',
        }}/>
        <View style={{
          borderWidth: 2.5, 
          borderRadius: 5,
          height: "8.6%", 
          width: "8.6%", 
          position: 'absolute', 
          top: '70%',
          left: '89%',
          borderColor: '#ff9359',
        }}/>
        <View style={{
          borderWidth: 2.5, 
          borderRadius: 5,
          height: "8.6%", 
          width: "8.6%", 
          position: 'absolute', 
          top: '88%',
          left: '71%',
          borderColor: '#ff9359',
        }}/>
      </View>
      
      <View style={{position: 'absolute', top: '60%'}}>
        <TouchableOpacity 
          style={{
            borderWidth: 3,
            borderRadius: 5,
            borderColor: '#c2cad1', 
            //backgroundColor: '#c2cad1',
            width: 300,
            height: 70,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => props.navigation.navigate('Scanner')}
        >
          <Text style={{fontSize: 25, fontFamily: 'Euphemia UCAS', color: '#4d5d6b',}}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{
            marginTop: 13,
            borderWidth: 3,
            borderRadius: 5,
            borderColor: '#4d5d6b',
            backgroundColor: '#c2cad1',
            width: 300,
            height: 70,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={() => props.navigation.navigate('Sender')}
        >
          <Text style={{fontSize: 25, fontFamily: 'Euphemia UCAS', color: '#ffffff'}}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'Qtr',
            headerStyle: {
              backgroundColor: '#ff9359',
              height: 100,
            },
            headerTintColor: '#615d5b',
            headerTitleStyle: {
              fontFamily: 'Futura',
              fontSize: 35,
            },
          }}
        />
        <Stack.Screen 
          name="Scanner" 
          component={ScannerScreen} 
          options={{
            title: "Download",
            headerStyle: {
              height: 100,
              borderBottomColor: "#c2cad1",
              borderBottomWidth: 2,
            },
            headerTitleStyle: {
                fontSize: 25,
                fontFamily: 'Euphemia UCAS',
                fontWeight: '100',
            },
            headerTintColor: "#4d5d6b",
          }}
        />
        <Stack.Screen 
          name="Sender" 
          component={SenderScreen} 
          options={{
            title: "Send",
            headerStyle: {
              height: 100,
              backgroundColor: "#c2cad1",
              borderBottomColor: '#4d5d6b', 
              borderBottomWidth: 2,
            },
            headerTitleStyle: {
                fontSize: 25,
                fontFamily: 'Euphemia UCAS',
                fontWeight: '100',
            },
            headerTintColor: "#ffffff",
          }} 
        />
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
    //backgroundColor: '#ff9359',
  },
});
