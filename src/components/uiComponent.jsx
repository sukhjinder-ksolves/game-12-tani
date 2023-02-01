import React from 'react';

export const PlayersPieces = (props) => {
    return(
    <div className={`piece-modal-outer piece-modal-view ${props.turn === 'no-one' ? 'disabled' : 'game-started'}`} >
        {props.pieceModalContainer.map( (piece,index) =>
          <div 
            key={piece.name} 
            onClick={() => props.placePlayer(index,piece.xPos,piece.yPos)} 
            className={`player player-position`}
          />
        )}
        {props.modalState.map( (piece,index) =>
          <div 
            key={`p${index}`} 
            className={`player player-on-view ${piece.playerColor} p${piece.playerOnPosition} ${piece.active ? 'active-player': ''}`} 
            style={{transform: `translate(${piece.xPos}px,${piece.yPos}px)`}}
            onClick={() => props.pickingPlayer(piece.playerColor,parseInt(piece.playerOnPosition),piece.name)} 
            data-on-position={piece.playerOnPosition}
          />
        )}
      </div>
    )
}

export const Button = (props) => {
    return(
        <button className={`btn btn-neon ${props.buttonClasses}`} onClick={props.buttonFunction}>
            <span></span>  
            <span></span>  
            <span></span>  
            <span></span> 
            {props.buttonName}
        </button>
    )
}

export const SideModal = (props) => {
    return(
        <div className={`side-modal side-modal-${props.modalNumber} ${props.kills === 12 ? `player-win player-win-${props.modalNumber}` : ''}`}>
          <div className="message-Modal" >
              <h1 className="board-heading">Player {props.modalNumber}</h1>
              <h2>Kills {props.kills}</h2>
              <h3>Dead {props.dead}</h3>
              <div className="game-timer" >
                {props.turn === `player-${props.modalNumber}` ? `${props.timerMin}:${props.timerSec}` : '0:00'}
              </div>
              <h1 className="board-heading board-heading-win">Wins</h1>
          </div>
        </div>
    )
}

export const GameBoard = () => {
  return(
    <div className="game-board">
      <div className="game-board-outer" />
      <div className="game-board-outer game-board-outer-2" />
    </div>
  )
}