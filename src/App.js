import React, { Component } from 'react'
import './App.css'
import { Container, Row, Col } from 'reactstrap';
import { Card, CardBody } from 'reactstrap';
import Keyboard from './Keyboard'
import Knob from 'react-canvas-knob'
import {FormGroup, Label, Input} from 'reactstrap'
import Utils from './Utils'


class App extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      audioContext: undefined,
      currentNotes: new Map(),
      modWheel: 64,
      attackKnob: 64,
      modRangeKnob: 1.0
    }
  }

  componentDidMount() {
    this.setState({
      audioContext: new (window.AudioContext || window.webkitAudioContext)()
    })
  }

  componentWillUnmount() {
    this.state.audioContext.close()
  }

  noteOn(midiNumber, velocity) {
    const audioContext = this.state.audioContext
    const startTime = audioContext.currentTime

    const env = audioContext.createGain()
    const attackTime = (this.state.attackKnob / 127) * 2
    console.log("attackTime", attackTime)
    
    const sustainTime = attackTime * 2
    const attackVolume = velocity / 127
    console.log("attackVolume", attackVolume)
    const sustainVolume = attackVolume * 0.75
    env.gain.value = 0.01
    env.connect(audioContext.destination)
    env.gain.exponentialRampToValueAtTime(attackVolume, startTime + attackTime)
    env.gain.exponentialRampToValueAtTime(sustainVolume, startTime + sustainTime)

    const modulatorRatio = this.state.modRangeKnob
    const modulator = audioContext.createOscillator()
    modulator.frequency.value = Utils.toFreq(midiNumber) * modulatorRatio

    const carrier = audioContext.createOscillator()
    carrier.frequency.value = Utils.toFreq(midiNumber)

    const modulatorAmount = 3000 * (this.state.modWheel / 127)
    console.log("Mod amount", modulatorAmount)
    const modulatorGain = audioContext.createGain()
    modulatorGain.gain.value = modulatorAmount

    modulator.connect(modulatorGain)
    modulatorGain.connect(carrier.frequency)
    carrier.connect(env)

    modulator.start(startTime)
    carrier.start(startTime)

    this.state.currentNotes.set(midiNumber, {
      env: env,
      carrier: carrier,
      modulator: modulator,
      modulatorGain: modulatorGain
    })
    this.setState({
        currentNotes: this.state.currentNotes
    })
  }

  noteOff(midiNumber) {
    const audioContext = this.state.audioContext
    const endTime = audioContext.currentTime + 0.2

    const currentNote = this.state.currentNotes.get(midiNumber)
    const carrier = currentNote.carrier
    const env = currentNote.env
    const modulator = currentNote.modulator
    const modulatorGain = currentNote.modulatorGain

    const releaseTime = 1
    env.gain.cancelAndHoldAtTime(audioContext.currentTime)
    env.gain.setTargetAtTime(0, audioContext.currentTime + 0.01, releaseTime)

    carrier.stop(endTime + (releaseTime * 5))
    carrier.onended = () => {
      carrier.disconnect()
    }

    modulator.stop(endTime + (releaseTime * 5))
    modulator.onended = () => {
      modulator.disconnect()
      env.disconnect()
      modulatorGain.disconnect()
    }
    this.state.currentNotes.delete(midiNumber)
    this.setState({
        currentNotes: this.state.currentNotes
    })
  }

  modChange(value) {
    console.log("Mod wheel", value)
    this.setState({
      modWheel: value
    })
  }
  
  attackKnobChange(value) {
    console.log("Attack knob", value)
    this.setState({
      attackKnob: value
    })
  }

  modRangeKnobChange(value) {
    console.log("Mod range", value)
    this.setState({
      modRangeKnob: value
    })
  }

  render() {
    return (
      <div>
        <Card>
          <CardBody>
            <Container fluid>
              <Row>
                <Col xs={1}>
                  <strong>Attack</strong>
                  <div><Knob width={60} 
                             min={1}
                             max={127} 
                             fgColor='black'
                             value={this.state.attackKnob}
                             onChange={(value) => this.attackKnobChange(value)}
                             />
                             </div>
                  
                </Col>
                <Col xs={1}>
                  <strong>Bright</strong>
                  <div><Knob width={60} 
                             max={127} 
                             fgColor='black'
                             value={64}/>
                             </div>
                             </Col>
                <Col xs={1}>
                  <strong>Type</strong>
                  <div>
                    <FormGroup check>
                      <Label check>
                        <Input type="radio" name="radio1" />{' '}
                        Sine
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input type="radio" name="radio1" />{' '}
                        Square
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input type="radio" name="radio1" />{' '}
                        Triangle
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input type="radio" name="radio1" />{' '}
                        Sawtooth
                      </Label>
                    </FormGroup>
                  </div>
                </Col>
                <Col xs={1}>
                  <strong>Range</strong>
                  <div>
                  <Knob width={60} 
                        min={0.5}
                        max={3.0} 
                        step={0.5}
                        fgColor='black'
                        value={this.state.modRangeKnob}
                        onChange={(value) => this.modRangeKnobChange(value)}
                        />
                  </div>
                </Col>
                <Col xs={8}/>
              </Row>
            </Container>
          </CardBody>
        </Card>
        <Keyboard noteOn={(note, velocity) => this.noteOn(note, velocity)} 
                  noteOff={(note) => this.noteOff(note)} 
                  modChange={modValue => this.modChange(modValue)}/>
      </div>
    )
  }
}

export default App
