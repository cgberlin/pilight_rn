import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import firebase from 'react-native-firebase'
import Picker from './components/Picker'
import { fromHsv } from 'react-native-color-picker'

export default class App extends React.Component {
  constructor() {
    super();
    this.stateRef = firebase.firestore().collection('states');
    this.userRef = firebase.firestore().collection('user');
    this.unsubStates = null;
    this.unsubUser = null;
    this.state = {
      type: '',
      color: {r:0,g:0,b:0},
      lastColorUpdate: new Date()
    };
  }

  async componentDidMount() {
    this.unsubStates = this.stateRef.onSnapshot(this._onStateRefUpdate.bind(this))
    this.unsubUser = this.userRef.onSnapshot(this._onUserRefUpdate.bind(this))
  }

  componentWillUnmount() {
    this.unsubStates();
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

  _stateUpdated(type) {
    this.stateRef.doc('control_type').update({type})
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
        {this.state.type === 'USER' &&
            <Picker pickedColor={(color) => this._colorUpdated(color)}/>
        }
        {this.state.type === 'PARTY' &&
            <Image style={styles.partyImage} source={{uri: 'https://i.imgur.com/2m2Y7pQ.gif'}} />
        }
       
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
