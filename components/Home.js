import React from 'react'
import { TouchableOpacity, Text, View, StyleSheet, ImageBackground, Image } from 'react-native';
import { Actions } from 'react-native-router-flux';


const Home = () => {
   const goToApp = () => {
      Actions.app()
   }
   return (
    <ImageBackground source={require('./image1.png')} style={styles.backgroundImage}>
        <View style = {{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity
                style={styles.loginScreenButton}
                onPress={goToApp}
                underlayColor='#fff'>
                <Image style = {{ width: 32, height: 32}} source={require('./imageedit_1_9692220803.png')} />
                <Text style={styles.loginText}>Camera</Text>
            </TouchableOpacity>
        </View>
    </ImageBackground>
   )
}

const styles = StyleSheet.create({
    loginScreenButton:{
        marginRight:80,
        marginLeft:80,
        paddingTop:20,
        paddingBottom:20,
        paddingRight: 20,
        paddingLeft: 20,
        backgroundColor:'#34373a66',
        borderRadius:20,
        alignItems: 'center'
      },
      loginText:{
          color:'#fff',
          textAlign:'center',
          
      },
      backgroundImage: {
        flex: 1,
        width: null,
        height: null,
        resizeMode: 'cover'
    }
 })
export default Home