import React, { Component } from 'react'
import 'web-midi-api'
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import 'react-piano/dist/styles.css'
import Knob from 'react-canvas-knob'
import { Container, Row, Col } from 'reactstrap';
import { Card, CardBody } from 'reactstrap';

const firstNote = MidiNumbers.fromNote('c2')
const lastNote = MidiNumbers.fromNote('g5')
const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: firstNote,
    lastNote: lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  })

 class Keyboard extends Component {
    constructor(props) {
        super(props)
        this.state = {
          volume: 64,
          mod: 64
        }
    }

    componentDidMount() {
        navigator.requestMIDIAccess().then(
          (access) => {
            console.log("We got midi access", access)
            const firstInput = access.inputs.values().next().value
            if(firstInput) {
              firstInput.onmidimessage = (event) => this.midiEvent(event)
            }
    
          },
          (err) => {
            console.log("We did not get MIDI", err)
          }
        )
      }

      midiEvent(event) {
        const data = event.data
        const controlNumber = data[0]
    
        switch(controlNumber) {
          case 144:
            this.noteOn(data[1], data[2])
            break
          case 128:
            this.noteOff(data[1])
            break
          case 176:
            this.handleModChange(data[2])
            break  
          case 224:
            const value = (data[2] << 7) + data[1] - 8192
            console.debug("Pitch bend", value)
            break  
          default:
            console.debug("Unhandled midi message", event)
        }
      }
    
      noteOn(midiNumber, velocity) {
        this.props.noteOn(midiNumber, velocity)
      }
    
      noteOff(midiNumber) {
        this.props.noteOff(midiNumber)
      }
    
      handleVolumeChange(value) {
        this.setState({
          volume: value
        })
      } 
      
      handleModChange(value) {
          this.setState({
              mod: value
          })
          this.props.modChange(value)
      }

      render() {
        return (
          <div>  
            <Card>
              <CardBody>
                <Container fluid>
                  <Row>
                    <Col xs={1} className="text-center">
                      <strong>Volume</strong>
                      <div><Knob width={60} 
                                 max={127} 
                                 fgColor='black'
                                 value={this.state.volume} 
                                 onChange={newValue => this.handleVolumeChange(newValue)}/></div>
                    </Col>
                    <Col xs={1}>
                      <strong>Mod</strong>
                      <div><Knob width={60} 
                                 max={127} 
                                 fgColor='black'
                                 value={this.state.mod} 
                                 onChange={newValue => this.handleModChange(newValue)}/></div>
                    </Col>
                    <Col xs={10}>
                      <Piano noteRange={{ first: firstNote, last: lastNote }}
                             playNote={(midiNumber) => this.noteOn(midiNumber, this.state.volume)}
                             stopNote={(midiNumber) => this.noteOff(midiNumber)}
                             width={1000}
                             keyboardShortcuts={keyboardShortcuts}/>      
                    </Col>
                  </Row>
                </Container>
              </CardBody>
            </Card>     
          </div>
        )
      }  
 }
 
 export default Keyboard