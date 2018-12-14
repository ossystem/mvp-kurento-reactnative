import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import WebRtcPeer from 'react-native-kurento-utils';
import Dimensions from 'Dimensions';
const {width, height} = Dimensions.get('window');

let ws;
var webRtcPeer;
var state = null;

const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

var remoteVideo;
var videoStream;
function start() {
	console.log('Starting video call ...');
	console.log('Creating WebRtcPeer and generating local sdp offer ...');

    var options = {
      videoStream: videoStream,
      remoteVideo: remoteVideo,
      onicecandidate : onIceCandidate,
      onaddstream: function(e) {
        container.setState({ remoteViewSrc: e.stream.toURL() });
      },
      configuration: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'turn:kurento-stage.ossystem.ua:3478',
            credential: 'password',
            username: 'username'
          },
        ]
      },
      mediaConstraints: {
        audio: false,
        video: {
          mandatory: {
            maxWidth: 480,
            maxHeight: 640,
            maxFrameRate: 10
          },
          facingMode: "user"
        },
      }
    }

    webRtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
        if(error) return onError(error);
        this.generateOffer(onOffer);
    });
}
function onIceCandidate(candidate) {
  console.log('Local candidate' + JSON.stringify(candidate));

  var message = {
     id : 'onIceCandidate',
     candidate : candidate
  };
  sendMessage(message);
}

function onOffer(error, offerSdp) {
	if(error) return onError(error);

	console.info('Invoking SDP offer callback function ');
	var message = {
		id : 'start',
		sdpOffer : offerSdp
	}
	sendMessage(message);
}

function onError(error) {
	console.error(error);
}


function startResponse(message) {
	console.log('SDP answer received from server. Processing ...');
	webRtcPeer.processAnswer(message.sdpAnswer);
}

function stop() {
	console.log('Stopping video call ...');
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		var message = {
			id : 'stop'
		}
		sendMessage(message);
	}
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	ws.send(jsonMessage);
}
function push() {
  console.log('Pushing data to encoder');
  const labels = {};
  labels['Label1_val'] = Math.floor(Math.random() * 10) + 1;
  labels['Label2_val'] = Math.floor(Math.random() * 10) + 1;
  labels['Label3_val'] = Math.random().toString(36).substring(2, 15);
  labels['Label4_val'] = Math.floor(Math.random() * 10) + 1;
  labels['Label5_val'] = Math.floor(Math.random() * 10) + 1;
  labels['Label6_val'] = Math.floor(Math.random() * 10) + 1;
  console.log('labels', labels);
  Object.keys(labels).forEach( key => {
    const message = {
      id : 'control',
      key: key,
      value: labels[key],
    }
    sendMessage(message);
  });

  const m = {
    id : 'control',
    key: 'ts',
    value: +(new Date()),
  }
  sendMessage(m);
}
// let container;
export default class AppMain extends Component{
  static onEnter = () => {
    ws = new WebSocket('wss://kurento-stage.ossystem.ua/magicmirror');
    ws.onopen = function () {
      start();
    }
    
    ws.onmessage = function(message) {
      var parsedMessage = JSON.parse(message.data);
      console.info('Received message: ' + message.data);
      switch (parsedMessage.id) {
        case 'data':
          /*parsedMessage.data.keys().forEach(label => {
            const d = {};
            d[label] = parsedMessage.data[label];
            container.setState({ remoteViewSrc: e.stream.toURL() });
          });*/
          container.setState(parsedMessage.data);
          break;
        case 'startResponse':
          startResponse(parsedMessage);
          break;
        case 'error':
          if (state == I_AM_STARTING) {
            setState(I_CAN_START);
          }
          onError('Error message from server: ' + parsedMessage.message);
          break;
        case 'iceCandidate':
          webRtcPeer.addIceCandidate(parsedMessage.candidate)
          break;
        default:
          if (state == I_AM_STARTING) {
            setState(I_CAN_START);
          }
          onError('Unrecognized message', parsedMessage);
      }
    }
  };
  constructor(props) {
    super(props);

    this.state =  {
      remoteViewSrc: null,
      Label1_val: '',
      Label2_val: '',
      Label3_val: '',
      Label4_val: '',
      Label5_val: '',
      Label6_val: '',
    };
    
  }
  componentDidMount() {
    container = this;
  }

  render() {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
        <View style={styles.container}>
          <RTCView streamURL={this.state.remoteViewSrc} style={styles.backgroundImage}>
            <View style={{flex: 1, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center'}}>
              <View style={styles.box1}>
                <Text style={styles.labels}>Label 1</Text>
                <Text style={[styles.labelsCenter, {fontSize: 34, lineHeight: heightLabels-14}]}>{this.state.Label1_val}</Text>
              </View>
              <View style={styles.box2}>
                <Text style={styles.labels}>Label 2</Text>
                <Text style={[styles.labelsCenter, {fontSize: 34, lineHeight: heightLabels-14}]}>{this.state.Label2_val}</Text>
              </View>
              <View style={styles.box3}>
                <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center',  alignItems: 'stretch', }}>
                  <View style={{height: heightLabels/2, borderBottomColor: '#fff',borderBottomWidth: 1,}}>
                    <Text style={styles.labels}>Label 3</Text>
                    <Text style={[styles.labels, styles.labelsCenter, {fontSize: 16, lineHeight: 24}]}>{this.state.Label3_val}</Text>
                  </View>
                  <View style={{height: heightLabels/2, flex: 1, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center'}}>
                    <View style={{flexGrow: 1, borderRightColor: '#fff',borderRightWidth: 1,}}>
                      <Text style={styles.labels}>Label 4</Text>
                      <Text style={[styles.labels, styles.labelsCenter, {fontSize: 16, lineHeight: 24}]}>{this.state.Label4_val}</Text>
                    </View>
                    <View style={{flexGrow: 1, borderRightColor: '#fff',borderRightWidth: 1,}}>
                      <Text style={styles.labels}>Label 5</Text>
                      <Text style={[styles.labels, styles.labelsCenter, {fontSize: 16, lineHeight: 24}]}>{this.state.Label5_val}</Text>
                    </View>
                    <View style={{flexGrow: 1}}>
                      <Text style={styles.labels}>Label 6</Text>
                      <Text style={[styles.labels, styles.labelsCenter, {fontSize: 16, lineHeight: 24}]}>{this.state.Label6_val}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={{alignItems:'center', justifyContent:'center',}}>
              <TouchableOpacity onPress={push} style={{
                borderWidth:10,
                borderColor:'white',
                width:80,
                height:80,
                borderRadius:80,
              }} />
            </View>
          </RTCView>        
        </View>
      </SafeAreaView>
    );
  }
}
const heightLabels = parseInt(height*0.14);
const styles = StyleSheet.create({
  labels:{
    fontSize: 10,
    color: 'white',
    paddingLeft: 5
  },
  labelsCenter:{
    textAlign: 'center',
    color: 'white'
  },
  box1: {
    flexGrow: 1,
    height: heightLabels,
    backgroundColor:'#34373a66',
    borderRightColor: '#fff',
    borderRightWidth: 1,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  box2: {
    flexGrow: 1,
    height: heightLabels,
    backgroundColor:'#34373a66',
    borderRightColor: '#fff',
    borderRightWidth: 1,
  },
  box3: {
    flexGrow: 3,
    height: heightLabels,
    backgroundColor:'#34373a66',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  floatView: {
    position: 'absolute',
    width: 80,
    height: 110,
    bottom: 15,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15
  },
  selfView: {
    width: 150,
    height: 110,
    borderWidth: 10,
    borderColor: 'green',
  },
  box: {
    height: 50,
    marginLeft:2,
    marginRight:2,
    width:'40%',
  },
  remoteView: {
    width: 400,
    height: 300,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
    resizeMode: 'cover',
    backgroundColor: '#fff',
}
});
