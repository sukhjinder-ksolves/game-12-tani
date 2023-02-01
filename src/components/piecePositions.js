import React, {Component} from "react";
import {pieceModalContainer} from "./gamePieceModal";
import { CloseIcon,StartIcon,ChangeIcon } from './icons';
import GameStart from '../sounds/game-start.mp3';
import PlayerOut from '../sounds/player-out.wav';
import ErrorSound from '../sounds/error.wav';
import GameWin from '../sounds/win.wav';
import ShiftChange from '../sounds/shift.wav';
import {PlayersPieces,Button,SideModal,GameBoard} from './uiComponent';
import io from "socket.io-client";
const ENDPOINT = 'http://localhost:5000/';
let socket = io(ENDPOINT);

class Pieces extends Component {

  state = { 
    modalState: JSON.parse(JSON.stringify(pieceModalContainer)), 
    playerPicked: 'null',
    goingTo: 'null',
    turn: 'no-one',
    playerOneDead: 0,
    playerTwoDead: 0,
    timerMin: 0,
    timerSec: 0,
    turnTime: 120,
    paused: false,
    pausedTime: 0,
    currentActive: 12,
    errorMsg: false,
    menuOpen: false,
    soundOn: true,
  }

  baseState = JSON.parse(JSON.stringify(this.state));

  playSound = sound => {
    if(this.state.soundOn) {
      let audio = new Audio(sound);
      audio.play();
    }
  }
  playerPickedNull = () => {
    this.setState({
      playerPicked: 'null'
    });
  }

  unsetActivePlayer = () => {
    let newModal = this.state.modalState;
    newModal[this.state.currentActive].active = false;

    this.setState({
      modalState: newModal
    });
  }

  turnChange = () => {
    this.playerPickedNull();
    clearInterval(this.ts);
    let newModal = this.state.modalState;
    newModal[this.state.currentActive].active = false;

    if(this.state.turn === 'player-1') {
      this.setState({
        turn: 'player-2'
      });  
    }
    else {
      this.setState({
        turn: 'player-1'
      });
    }
    this.setState({
      timerMin: 0,
      timerSec: 0,
      modalState: newModal
    });
    this.turnTimerOn();
    this.playSound(ShiftChange);
  }

  checkDeath = (start,end) => {
    let dead = false;
    let positionValue = start - end;

    if(positionValue === 2) {
      dead = end + 1;
    }
    if(positionValue === -2) {
      dead = end - 1;
    }
    if(positionValue === 8) {
      dead = end + 4;
    }
    if(positionValue === -8) {
      dead = end - 4;
    }

    if(positionValue === 10) {
      dead = end + 5;
    }
    if(positionValue === -10) {
      dead = end - 5;
    }
    if(positionValue === 12) {
      dead = end + 6;
    }
    if(positionValue === -12) {
      dead = end - 6;
    }


    if(dead) {
      let deadPlayerIndex = this.state.modalState.find(e => (e.playerOnPosition === dead && e.playerColor !== "dead-player"));
      let playerDead = this.state.modalState[deadPlayerIndex.name].playerColor;

      if(this.state.turn === playerDead) {
        dead = false;
      }
    }

    return dead;
  }

  checkLegalMove = (start,end) => {
    let move = false;
    let moveValue = start - end;
    let moveCondition = 
    moveValue === -1 || 
    moveValue === 1  || 
    moveValue === 5 || 
    moveValue === -5 || 
    (moveValue === 6 && start%2 === 0 && end%2 === 0) || 
    (moveValue === -6 && start%2 === 0 && end%2 === 0) || 
    (moveValue === 4 && start%2 === 0 && end%2 === 0) || 
    (moveValue === -4 && start%2 === 0 && end%2 === 0) ;

    if(moveCondition) {
      move = true;
    }

    return move;
  }

  pickingPlayer = (playerPlaying,playerGoing,index) => {
    if(playerPlaying === this.state.turn) {
      if(this.state.playerPicked === 'null') {
        let newModal = this.state.modalState;
        newModal[index].active = true;

        this.setState({
          playerPicked: playerGoing,
          currentActive: index,
          modalState: newModal
        });
      }
      else {
        this.raiseError('Move not allowed');
      } 
    }
    else if(playerPlaying !== this.state.turn && this.state.playerPicked !== 'null') {
      this.raiseError('Wrong Move');
    }
    else {
      this.raiseError('Not your player');
    }
  }

  placePlayer = (name,xPos,yPos) => {
    if(this.state.playerPicked === 'null') {
      this.raiseError('No player picked');
    }
    else {
      let legalMove = this.checkLegalMove(this.state.playerPicked,name);
      let dead = this.checkDeath(this.state.playerPicked,name);
      let newModal = this.state.modalState;
      let playerMoving = newModal.find(e => e.playerOnPosition === this.state.playerPicked && e.playerColor !== "dead-player" );
      
      if(legalMove || dead) {
        newModal[playerMoving.name].xPos = xPos;
        newModal[playerMoving.name].yPos = yPos;
        newModal[playerMoving.name].playerOnPosition = name;
        this.playerPickedNull();
      }
      else {
        this.raiseError('Wrong Move');
      }

      if(dead) {
        let deadPlayerIndex = newModal.find(e => (e.playerOnPosition === dead && e.playerColor !== "dead-player"));
        let playerDead = newModal[deadPlayerIndex.name].playerColor;

        if(playerDead === 'player-1') {
          this.setState({
            playerOneDead: this.state.playerOneDead + 1
          });
        }
        else if(playerDead === 'player-2') {
          this.setState({
            playerTwoDead: this.state.playerTwoDead + 1
          });
        }

        newModal[deadPlayerIndex.name].playerColor = 'dead-player';
        this.setState({
          modalState: newModal
        },function(){
          if(this.state.playerOneDead === 12 || this.state.playerTwoDead === 12) {
            this.playSound(GameWin);
            setTimeout(() => { 
              this.gameStop();
            },3000);
          }
        });
        this.playSound(PlayerOut);
      }

      this.setState({
        playerPicked: name
      });
    }
  }

  turnTimerOn = (timerTime = this.state.turnTime) => {
      let time = timerTime;
      
      this.ts = setInterval(()=> {
        let mints = Math.floor(time/60);
        let sec = time % 60;
        sec = sec < 10 ? '0' + sec : sec;

        this.setState({
          timerMin: mints,
          timerSec: sec
        })

        time--;

        if(time === 0) {
          
          let newModal = this.state.modalState;
          let deadPlayerIndex;

          if(this.state.turn === "player-1") {
            deadPlayerIndex = newModal.find(e => (e.playerColor === "player-1"));
            this.setState({
              playerOneDead: this.state.playerOneDead + 1
            });
          }
          else {
            deadPlayerIndex = newModal.find(e => (e.playerColor === "player-2"));
            this.setState({
              playerTwoDead: this.state.playerTwoDead + 1
            });
          }

          newModal[deadPlayerIndex.name].playerColor = 'dead-player';
          this.setState({
            modalState: newModal
          });
          this.raiseError('Player died');
          this.turnChange();
        }

      },1000);
  }

  gameStart = () => {
    this.playSound(GameStart);
    this.setState({
      turn: 'player-1'
    })
    this.turnTimerOn();
  }

  gameStop = () => {
    clearInterval(this.ts);
    this.setState(this.baseState)
    this.showMenus();
  }

  gamePause = () => {
    let pauseTime =  (this.state.timerMin*60) + this.state.timerSec;
    clearInterval(this.ts);

    this.setState({
      paused: true,
      pausedTime: pauseTime - 1
    })
  }

  gamePlay = () => {
    this.turnTimerOn(this.state.pausedTime);

    this.setState({
      paused: false,
      pausedTime: this.state.turnTime
    })
  }

  raiseError = msg => {
    this.setState({
      errorMsg: msg
    });
    document.querySelector('#root').classList.add('show-error');
    this.playSound(ErrorSound);

    setTimeout(() => { 
      this.closeError();
    },3000);
  }

  closeError = () => {
    this.setState({
      errorMsg: false
    });
    document.querySelector('#root').classList.remove('show-error');
  }

  changePlayer = () => {
    this.playerPickedNull();
    this.unsetActivePlayer();
  }

  showMenus = () => {
    document.querySelector('#root').classList.toggle('show-menus');

    this.setState({
      menuOpen: !this.state.menuOpen
    })
  }

  handleKeyPress = e => {
    // alert(e.keyCode);
    if(e.keyCode === 16) {
      this.turnChange();
    }

    if(e.keyCode === 27) {
      this.closeError();
    }
    socket.emit('Move-Done', this.state);
  }

  handleClickDoc = e => {
    socket.emit('Move-Done', this.state);
  }

  handleSound = () => {
    this.setState({
      soundOn: !this.state.soundOn
    })
  }

  componentDidMount = () => {
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
    document.addEventListener("click", this.handleClickDoc.bind(this));

    socket.on('Move-Done', (stateServer) => {
      this.setState(stateServer);
    });
  }

  componentWillUnmount = () => {
    document.removeEventListener("keydown", this.handleKeyPress.bind(this));
  }

  render() {
    return(
      <>
        <div className="nav-top">
          <Button 
            buttonName="Pause" 
            buttonFunction={this.gamePause}
            buttonClasses={`btn-play-pause ${this.state.paused ? 'd-none': ''}`} 
          />
          <Button 
            buttonName="Play" 
            buttonFunction={this.gamePlay}
            buttonClasses={`btn-play-pause ${!this.state.paused ? 'd-none': ''}`} 
          />
          <Button 
            buttonName="Change Player" 
            buttonFunction={this.changePlayer}
          />
          <Button 
            buttonName={`Sound ${this.state.soundOn ? 'Off' : 'On'}`} 
            buttonFunction={this.handleSound}
            buttonClasses="btn-sound" 
          />
          <Button 
            buttonName="Quit" 
            buttonFunction={this.gameStop}
            buttonClasses="mr-0" 
          />
        </div>
        <div className="game-board-main" >
          <GameBoard />
          <PlayersPieces 
            turn={this.state.turn} 
            modalState={this.state.modalState}
            placePlayer={this.placePlayer}
            pickingPlayer={this.pickingPlayer}
            pieceModalContainer={pieceModalContainer}
          />
        </div>
        <SideModal
          modalNumber="1"
          kills={this.state.playerTwoDead}
          dead={this.state.playerOneDead}
          turn={this.state.turn}
          timerMin={this.state.timerMin}
          timerSec={this.state.timerSec}
        />
        <SideModal
          modalNumber="2"
          kills={this.state.playerOneDead}
          dead={this.state.playerTwoDead}
          turn={this.state.turn}
          timerMin={this.state.timerMin}
          timerSec={this.state.timerSec}
        />
        <div className="menu-toggle" onClick={this.showMenus}>
          <div className={`navToggle ${this.state.menuOpen? 'open' : ''}`}>
            <div className="icon-left"></div>
            <div className="icon-right"></div>
          </div>
        </div>
        <div className={`menu-toggle menu-toggle-right ${this.state.turn === 'player-1' ? 'd-none' : ''}`} onClick={this.turnChange}>
          <ChangeIcon mainClass={`change-icon ${this.state.turn === "player-1" ? 'change-icon-1' : 'change-icon-2'}`} />
        </div>
        <div className={`menu-toggle menu-toggle-right ${this.state.turn === 'no-one' ? '' : 'd-none'}`} onClick={this.gameStart}>
          <StartIcon mainClass="start-icon" />
        </div>
        <div className={`menu-toggle menu-toggle-up ${this.state.turn === 'no-one' || this.state.turn === 'player-2' ? 'd-none' : ''}`} onClick={this.turnChange}>
          <ChangeIcon mainClass={`change-icon ${this.state.turn === "player-1" ? 'change-icon-1' : 'change-icon-2'}`} />
        </div>
        <div className="error-msg">
            {this.state.errorMsg}
            <button className="close-icon-outer" onClick={this.closeError}>
              <CloseIcon mainClass="close-icon" />
            </button>
        </div>
      </>
    )
  }
}

export default Pieces;
