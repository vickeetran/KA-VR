/* global Materialize, $ */
/* eslint-disable no-console, no-eval */
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Speech from './Speech';
import { executeModal } from '../actions/Modal';
import {
  toggleRecording,
  updateHistory,
  callTextAnalyzer,
  updateSurvey,
  getGeo,
} from '../actions';
const KEY_SPACEBAR = 32;
const KEY_ENTER = 13;

class SpeechContainer extends Component {
  constructor(props) {
    super(props);
    this.toggleRecording = this.toggleRecording.bind(this);
    this.recognizer = null;
    this.debounce = this.debounce.bind(this);
    this.autoend = this.debounce(() => {
      if (this.props.isRecording) this.toggleRecording();
    }, 2000);
  }

  componentDidMount() {
    const { dispatch } = this.props;
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!window.SpeechRecognition) {
      Materialize.toast('Speech Recognition not supported', 3000);
    } else {
      this.recognizer = new window.SpeechRecognition();
      this.recognizer.continuous = true;
      this.recognizer.interimResults = true;
      this.recognizer.onresult = (event) => {
        this.updateTranscription(event);
        if (this.props.isRecording) this.autoend();
      };
      // Listen for errors
      this.recognizer.onerror = (event) => {
        Materialize.toast(`Recognizer Error: ${event.message}`, 3000);
      };
    }
    $(document).on('mousedown', event => {
      if (event.target !== $('input')) $('input').blur();
    });
    $(document).on('keydown', event => {
      const command = $('#command').val();
      switch (event.keyCode) {
        case KEY_SPACEBAR:
          if (!$('input').is(':focus')) {
            if (!this.props.isRecording) this.autoend();
            this.toggleRecording();
          }
          return true;
        case KEY_ENTER:
          if ($('#command').is(':focus') && command.length) {
            $('#command').val('');
            if (command.toLowerCase().trim() === 'run last action' ||
                command.toLowerCase().trim() === 'run last command') {
              let thing;
              console.log('actions are:', this.props.actions);
              const actions = this.props.actions;
              if (actions.result.contexts instanceof Array &&
                actions.result.contexts.length !== 0) {
                thing = actions.result.contexts.join(' ');
              } else {
                thing = actions.result.keyword.name;
              }
              console.log('running last action:', actions.result.funct.code);
              Materialize.toast('Running last action.', 3000);
              const u = new SpeechSynthesisUtterance('Running last action.');
              speechSynthesis.speak(u);
              eval(actions.result.funct.code)($, thing, dispatch, executeModal, this.props);
            } else if (command.toLowerCase().trim() === 'turn light off' ||
                command.toLowerCase().trim() === 'turn lights off') {
              $.ajax({
                url: 'http://newreactions.io/api/v1/kavr',
                method: 'POST',
                data: {
                  body: 'text turn off',
                  name: 'kavr',
                },
              });
              Materialize.toast('Turning light off.', 3000);
              const u = new SpeechSynthesisUtterance('Lights off.');
              speechSynthesis.speak(u);
            } else if (command.toLowerCase().trim() === 'turn light on' ||
               command.toLowerCase().trim() === 'turn lights on') {
              $.ajax({
                url: 'http://newreactions.io/api/v1/kavr',
                method: 'POST',
                data: {
                  body: 'text turn on',
                  name: 'kavr',
                },
              });
              Materialize.toast('Turning light on.', 3000);
              const u = new SpeechSynthesisUtterance('Lights on.');
              speechSynthesis.speak(u);
            } else if (command.toLowerCase().trim() === 'caviar introduce yourself') {
              const u = new SpeechSynthesisUtterance(`
                Hello hack reactor. My name is caviar. I am the greatest. I am a web assistant
                for the world. I can perform various tasks ranging from searching the web to
                playing your favorite video. I can even turn on the light. Check it out.
              `);
              speechSynthesis.speak(u);
              u.onend = () => {
                $.ajax({
                  url: 'http://newreactions.io/api/v1/kavr',
                  method: 'POST',
                  data: {
                    body: 'text turn on',
                    name: 'kavr',
                  },
                });
              };
            } else {
              console.log('Going to text analyze', command);
              dispatch(callTextAnalyzer(command));
              dispatch(updateHistory(command));
            }
          }
          return true;
        default:
          return true;
      }
    });
    dispatch(getGeo());
  }

  debounce(func, wait, immediate, ...args) {
    let timeout = null;
    return () => {
      const context = this;
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  updateTranscription(event) {
    const { dispatch } = this.props;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const finalTranscription = event.results[i][0].transcript;
        console.log('transcription is:', finalTranscription);
        if (finalTranscription.toLowerCase().trim() === 'run last action' ||
            finalTranscription.toLowerCase().trim() === 'run last command') {
          let thing;
          const actions = this.props.actions;
          if (actions.result.contexts.length !== 0) {
            thing = actions.result.contexts.join(' ');
          } else {
            thing = actions.result.keyword.name;
          }
          console.log('running last action:', actions.result.funct.code);
          Materialize.toast('Running last action.', 3000);
          const u = new SpeechSynthesisUtterance('Running last action.');
          speechSynthesis.speak(u);
          eval(actions.result.funct.code)($, thing, dispatch, executeModal, this.props);
        } else if (finalTranscription.toLowerCase().trim() === 'turn light off' ||
            finalTranscription.toLowerCase().trim() === 'turn lights off') {
          $.ajax({
            url: 'http://newreactions.io/api/v1/kavr',
            method: 'POST',
            data: {
              body: 'text turn off',
              name: 'kavr',
            },
          });
          Materialize.toast('Turning light off.', 3000);
          const u = new SpeechSynthesisUtterance('Lights off.');
          speechSynthesis.speak(u);
        } else if (finalTranscription.toLowerCase().trim() === 'turn light on' ||
            finalTranscription.toLowerCase().trim() === 'turn lights on') {
          $.ajax({
            url: 'http://newreactions.io/api/v1/kavr',
            method: 'POST',
            data: {
              body: 'text turn on',
              name: 'kavr',
            },
          });
          Materialize.toast('Turning light on.', 3000);
          const u = new SpeechSynthesisUtterance('Lights on.');
          speechSynthesis.speak(u);
        } else if (finalTranscription.toLowerCase().trim() === 'caviar introduce yourself') {
          const u = new SpeechSynthesisUtterance(`
            Hello hack reactor. My name is caviar. I am the greatest. I am a web assistant
            for the world. I can perform various tasks ranging from searching the web to
            playing your favorite video. I can even turn on the light. Check it out.
          `);
          speechSynthesis.speak(u);
          u.onend = () => {
            $.ajax({
              url: 'http://newreactions.io/api/v1/kavr',
              method: 'POST',
              data: {
                body: 'text turn on',
                name: 'kavr',
              },
            });
          };
        } else {
          console.log('Going to text analyze', finalTranscription);
          dispatch(callTextAnalyzer(finalTranscription));
          dispatch(updateHistory(finalTranscription));
        }
      }
    }
  }

  toggleRecording() {
    const { dispatch, setRecording } = this.props;
    const status = this.props.isRecording ? 'stopped' : 'started';
    Materialize.toast(`KAVR has ${status} Listening...`, 3000);
    dispatch(setRecording(this.recognizer));
  }

  render() {
    return (
      <Speech
        isRecording={this.props.isRecording}
        toggleRecording={this.toggleRecording}
      />
    );
  }
}

SpeechContainer.propTypes = {
  dispatch: PropTypes.func.isRequired,
  setRecording: PropTypes.func.isRequired,
  callTextAnalyzer: PropTypes.func.isRequired,
  updateHistory: PropTypes.func.isRequired,
  isRecording: PropTypes.bool.isRequired,
  actions: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  const { isRecording, geoState, actions } = state;
  return {
    isRecording,
    geoState,
    actions,
  };
};

const mapDispatchToProps = dispatch => ({
  dispatch,
  setRecording: recognizer => toggleRecording(recognizer),
  callTextAnalyzer: transcript => callTextAnalyzer(transcript),
  createSurvey: surveyInfo => updateSurvey(surveyInfo),
  updateHistory: transcription => updateHistory(transcription),
});

export default connect(mapStateToProps, mapDispatchToProps)(SpeechContainer);
