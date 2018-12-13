import React, { Component } from 'react'
import Knob from 'react-canvas-knob'
import { Container, Row, Col } from 'reactstrap';
import { Card, CardBody, CardTitle } from 'reactstrap';
import {FormGroup, Label, Input} from 'reactstrap'

class ModulatorControl extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      modRangeKnob: 1.0,
      modAmountKnob: 64,
      modAttackKnob: 64,
      oscType: 'sine'
    }
  }

  modAmountKnobChange(value) {
    this.setState({
      modAmountKnob: value
    })
    this.props.modAmountChange(value)
  }

  modRangeKnobChange(value) {
    this.setState({
      modRangeKnob: value
    })
    this.props.modRangeChange(value)
  }

  modAttackKnobChange(value) {
    this.setState({
      modAttackKnob: value
    })
    this.props.modAttackChange(value)
  }

  changeOscType(value) {
    this.setState({
      oscType: value
    })
    this.props.oscTypeChange(value)
  }

  render() {
    return (
      <div>
        <Card>
          
          <CardBody>
            <CardTitle>{this.props.title}</CardTitle>
            <Container>
              <Row>
                <Col xs="auto" className="text-center">
                  <strong>Range</strong>
                  <div>
                  <Knob width={60} 
                        min={-5}
                        max={15} 
                        step={1}
                        fgColor='black'
                        value={this.state.modRangeKnob}
                        onChange={(value) => this.modRangeKnobChange(value)}/>
                  </div>
                </Col>
              
                <Col xs="auto" className="text-center">
                  <strong>Amount</strong>
                  <div>
                  <Knob width={60} 
                        max={127} 
                        step={1}
                        fgColor='black'
                        value={this.state.modAmountKnob}
                        onChange={(value) => this.modAmountKnobChange(value)}/>
                  </div>
                </Col>

                <Col xs="auto" className="text-center">
                  <strong>Attack</strong>
                  <div>
                  <Knob width={60} 
                        max={127} 
                        step={1}
                        fgColor='black'
                        value={this.state.modAttackKnob}
                        onChange={(value) => this.modAttackKnobChange(value)}/>
                  </div>
                </Col>

                <Col xs="auto">
                  <strong>Type</strong>
                  <div>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name={this.props.title}
                        checked={this.state.oscType === 'sine'}
                        onChange={value => this.changeOscType('sine')}
                        />{' '}                
                        Sine
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name={this.props.title} 
                        checked={this.state.oscType === 'square'}
                        onChange={value => this.changeOscType('square')}
                        />{' '}
                        Square
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name={this.props.title} 
                        checked={this.state.oscType === 'triangle'}
                        onChange={value => this.changeOscType('triangle')}
                        />{' '}
                        Triangle
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input 
                        type="radio" 
                        name={this.props.title} 
                        checked={this.state.oscType === 'sawtooth'}
                        onChange={value => this.changeOscType('sawtooth')}
                        />{' '}
                        Sawtooth
                      </Label>
                    </FormGroup>
                  </div>
                </Col>
              </Row>
            </Container>
          </CardBody>
        </Card>
      </div>
    )
  }
}

export default ModulatorControl