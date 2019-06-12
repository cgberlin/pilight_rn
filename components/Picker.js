import React from 'react'
import { ColorPicker } from 'react-native-color-picker'

const Picker = (props) => (
    <ColorPicker
      onColorChange={color => props.pickedColor(color)}
      style={{flex: 1, height: 300}}
    />
)

export default Picker