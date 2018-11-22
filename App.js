import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  TextInput,
  ListView,
  Platform,
} from 'react-native';

const ws = new WebSocket('wss://pyrtc.ossystem.ua/ws')

import {
  RTCPeerConnection,
  RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStreamTrack,
  getUserMedia,
} from 'react-native-webrtc';

const configuration = {"iceServers": [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:91.197.18.224:3478',
    credential: 'password',
    username: 'username'
  }
]};

let pc = new RTCPeerConnection(configuration);
let localStream;

pc.onicegatheringstatechange = function() { console.log('icegatheringstatechange', pc.iceGatheringState); };
pc.oniceconnectionstatechange = function() { console.log('iceconnectionstatechange', pc.iceConnectionState); };
pc.onsignalingstatechange = function() { console.log('signalingstatechange', pc.signalingState); };
pc.onnegotiationneeded = function () { console.log('negotiationneeded'); };

ws.onmessage =  function (e) {
    var message = JSON.parse(e.data);
    console.log('message', message);

    if (message.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type == 'ping') {
        // it's okay
    } else if (message.type == 'ice') {
        // it's okay
    } else if (message.type == 'close') {
        console.error('room is full. reload to try again');
    } else if (message.type == 'renegotiate') {
        negotiate();
    } else {
        console.error('do not know what to do with this message');
    }
}

pc.onicecandidate = function (e) {
  console.log('icecandidate', e.candidate);
  if (e.candidate) {
      ws.send(JSON.stringify({ type: 'ice', ice: e.candidate }))
  }
};

pc.onaddstream = function(e) {
  console.log('addstream', e);
  container.setState({ remoteViewSrc: e.stream.toURL() });
};

setInterval(function () {
    ws.send(JSON.stringify({ type: 'ping' }))
}, 5000)

function negotiate() {
  return pc.createOffer().then(function(offer) {
      return pc.setLocalDescription(offer);
  }).then(function() {
    return new Promise(function(resolve) {
      setTimeout(function () {
        if (pc.iceGatheringState != 'complete') {
          resolve();
        };
      }, 5000);

      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        function checkState() {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        }
        pc.addEventListener('icegatheringstatechange', checkState);
      }
    });
  }).then(function() {
    var offer = pc.localDescription;
    console.log('offer', offer);
    ws.send(JSON.stringify({
      sdp: offer.sdp,
      type: offer.type
    }));
  }).catch(function(e) {
    alert(e);
  });
}

function start() {
  let videoSourceId;
  const isFront = true;
  if (Platform.OS === 'ios') {
    MediaStreamTrack.getSources(sourceInfos => {
      console.log("sourceInfos: ", sourceInfos);

      for (const i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
          videoSourceId = sourceInfo.id;
        }
      }
    });
  }

  var constraints = {
    audio: false,
    video: {
      mandatory: {
        maxWidth: 240,
        maxHeight: 320,
        maxFrameRate: 24
      },
      facingMode: (isFront ? "user" : "environment"),
      optional: (videoSourceId ? [{sourceId: videoSourceId}] : [])
    },
  };

  getUserMedia(constraints, function (stream) {
    console.log('getUserMedia success', stream);
    container.setState({ selfViewSrc: stream.toURL() });
    pc.addStream(stream);

    return negotiate();
  }, function(err) {
      console.error('Could not acquire media: ' + err);
  }).catch(function (err) {
      console.error('Could not acquire media: ' + err);
  });
}


function logError(error) {
  console.log("logError", error);
}

let container;

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

    start();
  }

  render() {
    // return (
    //   <View style={styles.container}>
    //     <Text>Hello Amigo</Text>
    //   </View>
    // );
    return (
      <View style={styles.container}>
        <Text>local</Text>
        <RTCView streamURL={this.state.selfViewSrc} style={styles.selfView}/>
        <Text>remote</Text>
        <RTCView streamURL={this.state.remoteViewSrc} style={styles.remoteView}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
    borderWidth: 10,
    borderColor: 'green',
  },
  remoteView: {
    width: 200,
    height: 150,
    borderWidth: 10,
    borderColor: 'red',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  }
});
