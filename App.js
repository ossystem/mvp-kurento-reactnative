import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Image,
  Button,
  Platform,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';

import WebRtcPeer from 'react-native-kurento-utils';

const ws = new WebSocket('wss://kurento-stage.ossystem.ua/magicmirror')
var videoInput;
var videoOutput;
var webRtcPeer;
var state = null;

const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

ws.onopen = function () {
  start();
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
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
        container.setState({ selfViewSrc: this.getLocalStream().toURL() });
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

export default class App extends Component{
  constructor(props) {
    super(props);

    this.state =  {
      selfViewSrc: null,
      remoteViewSrc: null,
    };
  }
  componentDidMount() {
    container = this;
  }

  render() {
    return (
      <View style={styles.container}>
        <Image
          style={{
            flex: 0.2,
            width: 151,
            height: 151,
            resizeMode: 'contain',
          }}
          source={{
            uri:
              `data:image/png;base64,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`,
          }}
        />
        <Text style={{ fontSize: 20 }} >OSSystem Demo</Text>
        <View style={{ flex: 0.2 }} />
        <Text>remote</Text>
        <RTCView streamURL={this.state.remoteViewSrc} style={styles.remoteView}/>
        <RTCView streamURL={this.state.selfViewSrc} style={styles.floatView}/>
        
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
  }
});
