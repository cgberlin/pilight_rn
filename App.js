import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import firebase from 'react-native-firebase'
import Picker from './components/Picker'
import { fromHsv } from 'react-native-color-picker'
import { Emitter } from 'react-native-particles' // lol
import TimePicker from "react-native-24h-timepicker" // im lazy

export default class App extends React.Component {
  constructor() {
    super();
    this.stateRef = firebase.firestore().collection('states');
    this.userRef = firebase.firestore().collection('user');
    this.displayRef = firebase.firestore().collection('display');
    this.unsubStates = null;
    this.unsubUser = null;
    this.unsubDisplay = null;
    this.state = {
      type: '',
      color: {r:0,g:0,b:0},
      lastColorUpdate: new Date(),
      pattern: '',
      startTime: '',
      stopTime: ''
    }
  }

  async componentDidMount() {
    this.unsubStates = this.stateRef.onSnapshot(this._onStateRefUpdate.bind(this))
    this.unsubUser = this.userRef.onSnapshot(this._onUserRefUpdate.bind(this))
    this.unsubDisplay = this.displayRef.onSnapshot(this._onDisplayRefUpdate.bind(this))
  }

  componentWillUnmount() {
    this.unsubStates()
    this.unsubUser()
    this.unsubDisplay()
  }

  secondsBetweenDates(dateOne, dateTwo) {
    let diff = dateOne.getTime() - dateTwo.getTime()
    return Math.abs(diff/1000)
  }

  hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  _getButtonStyle(type) {
    if (type === this.state.type) return styles.activeButtonWrapper
    else return styles.buttonWrapper
  }

  _getPatternButtonStyle(type) {
    if (type === this.state.pattern) return styles.activePatternButtonWrapper
    else return styles.patternButtonWrapper
  }

  _colorUpdated(color) {
    color = this.hexToRgb(fromHsv(color))
    let secondsBetween = this.secondsBetweenDates(this.state.lastColorUpdate, new Date())
    // need to slow down firestore updates
    if (secondsBetween > 1) {
      let lastColorUpdate = new Date()
      this.userRef.doc('config').update({
        color
      })
      this.setState({
        lastColorUpdate
      })
    }
  }

  _patternUpdated(pattern) {
    this.displayRef.doc('config').update({
      pattern
    })
  }

  _stateUpdated(type) {
    this.stateRef.doc('control_type').update({type})
  }

  onTimeCancel() {
    this.StartTimePicker.close();
    this.StopTimePicker.close();
  }

  onTimeConfirm(hour, minute, type) {
    if (type === 'start') {
      let startTime = `${hour}:${minute}` 
      this.displayRef.doc('config').update({
        startTime
      })
      this.setState({ startTime })
      this.StartTimePicker.close()
    } 
    if (type === 'stop') {
      let stopTime = `${hour}:${minute}` 
      this.displayRef.doc('config').update({
        stopTime
      })
      this.setState({ stopTime });
      this.StopTimePicker.close()
    }
  }

  _onStateRefUpdate(querySnapshot) {
    querySnapshot.forEach(doc => {
      let { type } = doc.data()
      this.setState({
        type
      })
    })
  }

  _onUserRefUpdate(querySnapshot) {
    querySnapshot.forEach(doc => {
      let { color } = doc.data()
      this.setState({
        color
      })
    })
  }

  _onDisplayRefUpdate(querySnapshot) {
    querySnapshot.forEach(doc => {
      let { startTime, stopTime, pattern } = doc.data()
      this.setState({
        pattern,
        startTime, 
        stopTime
      })
    })
  }

  render() {
    return (
      <View style={styles.outerScroll}>
        <View style={styles.container}>
          <TouchableOpacity 
              style={this._getButtonStyle('WEATHER')} 
              onPress={() => this._stateUpdated('WEATHER')}
            >
            <Text style={styles.buttonText}>Weather</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={this._getButtonStyle('USER')} 
              onPress={() => this._stateUpdated('USER')}
            >
            <Text style={styles.buttonText}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={this._getButtonStyle('PARTY')} 
              onPress={() => this._stateUpdated('PARTY')}
            >
            <Text style={styles.buttonText}>Party</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <TouchableOpacity 
              style={this._getPatternButtonStyle('SOLID')}
              onPress={() => this._patternUpdated('SOLID')}
            >
              <Text style={styles.buttonText}>Solid</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={this._getPatternButtonStyle('FLASH')}
              onPress={() => this._patternUpdated('FLASH')}
            >
              <Text style={styles.buttonText}>Flash</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={this._getPatternButtonStyle('BREATHE')}
              onPress={() => this._patternUpdated('BREATHE')}
            >
              <Text style={styles.buttonText}>Breathe</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={this._getPatternButtonStyle('OFF')}
              onPress={() => this._patternUpdated('OFF')}
            >
              <Text style={styles.buttonText}>Off</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>Start: {this.state.startTime}</Text>
            <TouchableOpacity 
              style={styles.activeButtonWrapper}
              onPress={() => this.StartTimePicker.open()}
            >
              <Text style={styles.buttonText}>Set</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>Stop: {this.state.stopTime}</Text>
            <TouchableOpacity 
                style={styles.activeButtonWrapper}
                onPress={() => this.StopTimePicker.open()}
              >
                <Text style={styles.buttonText}>Set</Text>
            </TouchableOpacity>
          </View>
        </View>
        {this.state.type === 'USER' &&
            <Picker pickedColor={(color) => this._colorUpdated(color)}/>
        }
        {this.state.type === 'PARTY' &&
            <Image style={styles.partyImage} source={{uri: 'https://i.imgur.com/2m2Y7pQ.gif'}} />
        }
        <Emitter
          numberOfParticles={50}
          emissionRate={5}
          interval={200}
          particleLife={3000}
          direction={90}
          spread={360}
          gravity={10}
          fromPosition={{ x: 180, y: 0 }}
        >
          <Image source={require('./assets/cat.png')} />
        </Emitter>
        <Emitter
          numberOfParticles={50}
          emissionRate={5}
          interval={200}
          particleLife={3000}
          direction={90}
          spread={360}
          gravity={10}
          fromPosition={{ x: 70, y: 0 }}
        >
          <Image source={require('./assets/cat.png')} />
        </Emitter>
        <Emitter
          numberOfParticles={50}
          emissionRate={5}
          interval={200}
          particleLife={3000}
          direction={90}
          spread={360}
          gravity={10}
          fromPosition={{ x: 250, y: 0 }}
        >
          <Image source={require('./assets/cat.png')} />
        </Emitter>
        <TimePicker
          ref={ref => {
            this.StartTimePicker = ref;
          }}
          onCancel={() => this.onTimeCancel()}
          onConfirm={(hour, minute) => this.onTimeConfirm(hour, minute, 'start')}
        />
        <TimePicker
          ref={ref => {
            this.StopTimePicker = ref;
          }}
          onCancel={() => this.onTimeCancel()}
          onConfirm={(hour, minute) => this.onTimeConfirm(hour, minute, 'stop')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  outerScroll: {
    padding: '10%',
    flex: 1
  },  
  partyImage: {
    height: 200,
    width: 'auto',
    marginTop: 100
  },  
  container: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  timeContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 100
  },
  buttonWrapper: {
    width: '30%',
    height: 40,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5
  },
  activeButtonWrapper: {
    width: '30%',
    height: 40,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5
  },
  patternButtonWrapper: {
    flex: 1,
    height: 40,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activePatternButtonWrapper: {
    flex: 1,
    height: 40,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },  
  logo: {
    height: 120,
    marginBottom: 16,
    marginTop: 64,
    padding: 10,
    width: 135,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  modules: {
    margin: 20,
  },
  modulesHeader: {
    fontSize: 16,
    marginBottom: 8,
  },
  module: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  }
});
