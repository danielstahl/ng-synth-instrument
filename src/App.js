import React, { Component } from 'react'
import './App.css'
import { Container, Row, Col } from 'reactstrap';
import { Card, CardBody } from 'reactstrap';
import Keyboard from './Keyboard'
import Knob from 'react-canvas-knob'
import {FormGroup, Label, Input} from 'reactstrap'
import Utils from './Utils'
import ModulatorControl from './ModulatorControl'

class App extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      audioContext: undefined,
      currentNotes: new Map(),
      modWheel: 64,
      attackKnob: 64,
      modRange1Knob: 1.0,
      modAmount1Knob: 64,
      modAttack1Knob: 64,
      modRange2Knob: 1.0,
      modAmount2Knob: 64,
      modAttack2Knob: 64,
      carrierType: 'sine',
      modulator1Type: 'sine',
      modulator2Type: 'sine',
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

  rescaleExp(position, min, max) {
    var minp = 0;
    var maxp = 127;
    
    var minv = Math.log(0.001);
    var maxv = Math.log(5);

    var scale = (maxv-minv) / (maxp-minp);
  
    return Math.exp(minv + scale * (position-minp));
  }

  rescaleLin(position, min, max) {
    var minp = 0;
    var maxp = 127;

    var scale = (max-min) / (maxp-minp);

    return min + scale * (position-minp)
  }

  noteOn(midiNumber, velocity) {
    const audioContext = this.state.audioContext
    const startTime = audioContext.currentTime

    const env = audioContext.createGain()
    const attackTime = this.rescaleExp(this.state.attackKnob, 0.001, 5)
    console.log("attackTime", attackTime)
    
    const sustainTime = attackTime * 2
    const attackVolume = velocity / 127 / 2
    console.log("attackVolume", attackVolume)

    const sustainVolume = attackVolume * 0.75
    env.gain.value = 0.01
    env.connect(audioContext.destination)
    env.gain.exponentialRampToValueAtTime(attackVolume, startTime + attackTime)
    env.gain.exponentialRampToValueAtTime(sustainVolume, startTime + sustainTime)

    const modulatorRatio = this.getRangeValue(this.state.modRange1Knob)
    const modulatorRatio2 = this.getRangeValue(this.state.modRange2Knob)

    const modulator = audioContext.createOscillator()
    modulator.type = this.state.modulator1Type
    modulator.frequency.value = Utils.toFreq(midiNumber) * modulatorRatio

    const modulator2 = audioContext.createOscillator()
    modulator2.type = this.state.modulator2Type
    modulator2.frequency.value = Utils.toFreq(midiNumber) * modulatorRatio2

    const carrier = audioContext.createOscillator()
    carrier.type = this.state.carrierType

    carrier.frequency.value = Utils.toFreq(midiNumber)

    const modulatorAmount = 3000 * (this.state.modAmount1Knob / 127) * (this.state.modWheel / 127)
    console.log("Mod amount", modulatorAmount)

    const modulator1attackTime = this.rescaleExp(this.state.modAttack1Knob, 0.001, 5)
    const modulatorGain = audioContext.createGain()
    modulatorGain.gain.value = 300
    modulatorGain.gain.exponentialRampToValueAtTime(modulatorAmount, startTime + modulator1attackTime)

    modulator.connect(modulatorGain)
    modulatorGain.connect(carrier.frequency)
    
    modulator.connect(env)

    const modulatorAmount2 = 3000 * (this.state.modAmount2Knob / 127) * (this.state.modWheel / 127)
    console.log("Mod amount2", modulatorAmount2)

    const modulator2attackTime = this.rescaleExp(this.state.modAttack2Knob, 0.001, 5)
    const modulatorGain2 = audioContext.createGain()
    
    modulatorGain2.gain.value = 300
    modulatorGain2.gain.exponentialRampToValueAtTime(modulatorAmount2, startTime + modulator2attackTime)


    modulator2.connect(modulatorGain2)
    modulatorGain2.connect(carrier.frequency)

    modulator2.connect(env)
    carrier.connect(env)

    modulator.start(startTime)
    modulator2.start(startTime)
    carrier.start(startTime)

    this.state.currentNotes.set(midiNumber, {
      env: env,
      carrier: carrier,
      modulator: modulator,
      modulator2: modulator2,
      modulatorGain: modulatorGain,
      modulatorGain2: modulatorGain2
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
    const modulator2 = currentNote.modulator2
    const modulatorGain = currentNote.modulatorGain
    const modulatorGain2 = currentNote.modulatorGain2

    const releaseTime = this.rescaleLin(this.state.attackKnob, 0.1, 1)
    console.log("release time", releaseTime)
    env.gain.cancelAndHoldAtTime(audioContext.currentTime)
    env.gain.setTargetAtTime(0, audioContext.currentTime + 0.01, releaseTime)

    const modulator1releaseTime = this.rescaleLin(this.state.modAttack1Knob, 0.6, 1)
    modulatorGain.gain.cancelAndHoldAtTime(audioContext.currentTime)
    modulatorGain.gain.setTargetAtTime(300, audioContext.currentTime + 0.01, modulator1releaseTime)
    
    const modulator2releaseTime = this.rescaleLin(this.state.modAttack2Knob, 0.6, 1)
    modulatorGain2.gain.cancelAndHoldAtTime(audioContext.currentTime)
    modulatorGain2.gain.setTargetAtTime(300, audioContext.currentTime + 0.01, modulator2releaseTime)

    carrier.stop(endTime + (releaseTime * 5))
    carrier.onended = () => {
      carrier.disconnect()
    }

    modulator.stop(endTime + (releaseTime * 5))
    modulator2.stop(endTime + (releaseTime * 5))
    modulator.onended = () => {
      modulator.disconnect()
      modulator2.disconnect()
      env.disconnect()
      modulatorGain.disconnect()
      modulatorGain2.disconnect()
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

  getRangeValue(value) {
    if(value < 0) {
      return 1.0 / Math.abs(value)
    } else {
      return value
    }
  }

  modRange1KnobChange(value) {
    console.log("Mod range 1", value)
    
    this.setState({
      modRange1Knob: value
    })
  }

  modAmount1KnobChange(value) {
    console.log("Mod amount 1", value)
    this.setState({
      modAmount1Knob: value
    })
  }

  modAttack1KnobChange(value) {
    console.log("Mod attack 1", value)
    this.setState({
      modAttack1Knob: value
    })
  }

  modRange2KnobChange(value) {
    console.log("Mod range 2", value)
  
    this.setState({
      modRange2Knob: value
    })
  }

  modAmount2KnobChange(value) {
    console.log("Mod amount 2", value)
    this.setState({
      modAmount2Knob: value
    })
  }

  modAttack2KnobChange(value) {
    console.log("Mod attack 2", value)
    this.setState({
      modAttack2Knob: value
    })
  }

  changeCarrierType(value) {
    console.log("carrier type", value)
    this.setState({
      carrierType: value
    })
  }

  changeModulator1Type(value) {
    console.log("modulator 1 type", value)
    this.setState({
      modulator1Type: value
    })
  }

  changeModulator2Type(value) {
    console.log("modulator 2 type", value)
    this.setState({
      modulator2Type: value
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
                             onChange={(value) => this.attackKnobChange(value)}/>
                             </div>
                </Col>
                
                <Col xs={1}>
                  <strong>Type</strong>
                  <div>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name="radio1"
                        checked={this.state.carrierType === 'sine'}
                        onChange={value => this.changeCarrierType('sine')}
                        />{' '}                
                        Sine
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name="radio1" 
                        checked={this.state.carrierType === 'square'}
                        onChange={value => this.changeCarrierType('square')}
                        />{' '}
                        Square
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name="radio1" 
                        checked={this.state.carrierType === 'triangle'}
                        onChange={value => this.changeCarrierType('triangle')}
                        />{' '}
                        Triangle
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name="radio1" 
                        checked={this.state.carrierType === 'sawtooth'}
                        onChange={value => this.changeCarrierType('sawtooth')}
                        />{' '}
                        Sawtooth
                      </Label>
                    </FormGroup>
                  </div>
                </Col>
                
                <ModulatorControl 
                  title="Modulator 1" 
                  modRangeChange={(range) => this.modRange1KnobChange(range)}
                  modAmountChange={(amount) => this.modAmount1KnobChange(amount)}
                  oscTypeChange={(amount) => this.changeModulator1Type(amount)}
                  modAttackChange={(amount) => this.modAttack1KnobChange(amount)}
                  />
                <ModulatorControl title="Modulator 2"
                modRangeChange={(range) => this.modRange2KnobChange(range)}
                modAmountChange={(amount) => this.modAmount2KnobChange(amount)}
                oscTypeChange={(amount) => this.changeModulator2Type(amount)}
                modAttackChange={(amount) => this.modAttack2KnobChange(amount)}
                />
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
