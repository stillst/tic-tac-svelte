<script>
  import Board from './components/Board.svelte';
  import Setup from './components/Setup.svelte';
  import Score from './components/Score.svelte';
  
  let matches = 0;
  let wins = { O: 0, X: 0 };
  let scale = 3;
  let gameStatus = 'start';
  let board = {};
  let mirrorBoard = {};
  let activePlayer = 'X';
  let moves = 0;

  $: for (let row = 0; row < scale; row++) { 
    board[row] = {};
    mirrorBoard[row] = {};
    
    for (let col = 0; col < scale; col++) {
      board[row][col] = '!';
      mirrorBoard[row][col] = 'f';
    }
  }

  $: notActivePlayer = activePlayer === 'X' 
    ? 'O'
    : 'X';

  function startGame(event) {
    scale = event.detail;
    gameStatus = 'turn';
  }

  function restart() {
    scale = 0;
    moves = 0;
    gameStatus = 'start';
  }

  function makeStep(event) {
    moves++;
    updateBoards(event.detail);
    updateGameStatus();
    updateActivePlayer();
  }

  function updateBoards(info) {
    board[info.row][info.col] = activePlayer;
    mirrorBoard[info.col][info.row] = activePlayer;
  }

  function updateGameStatus() {
    if (isActivePlayerWin()) {
      gameStatus = 'win';
      matches++;
      wins[activePlayer]++;
    }

    else if (moves === scale * scale) {
      gameStatus = 'draw';
      matches++;
    }
  }

  function updateActivePlayer() {
    activePlayer = notActivePlayer;
  }

  function isActivePlayerWin() {
    return isWinByСross(board) 
      || isWinByСross(mirrorBoard) 
      || isWinBySlash();
  }

  function isWinByСross(activeBoard) {
    const rows = Object.keys(activeBoard)

    for (const row of rows) {
      if (Object.values(activeBoard[row]).every(val => val === activePlayer)) {        
        return true;
      }
    }

    return false;
  }

  function isWinBySlash() {
    const slash = [];
    const backSlash = [];

    for (let i = 0; i < scale; i++) {
      for (let j = 0; j < scale; j++) {
        if (i === j) {
          slash.push(board[i][j]);
        } 
        else if (i + j === scale - 1) {
          backSlash.push(mirrorBoard[i][j]);
        } 
      }
    }

    if (slash.every(val => val === activePlayer) || backSlash.every(val => val === activePlayer)) {        
      return true;
    }

    return false;
  }

</script>

<style>
	#app {
    position: absolute;
    left: 50%;
    top: 20%;
    transform: translateX(-50%);
    display: inline-flex;
    flex-direction: column;
    margin: 0 auto;
		color: #2c3e50;
		border: 1px solid #000;
  }

  .info {
    text-align: center;
  }

  .results {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 10px;
  }
</style>


<div id="app">
  <Score {matches}, {wins}></Score>
  { #if gameStatus == 'start'}
    <Setup on:start={startGame}></Setup>
  {:else if gameStatus == 'turn'}
    <div class="info">
      <p>Ход №{moves} игрок - {activePlayer} </p>
    </div>
    <Board {scale}, {activePlayer} on:step={makeStep}></Board>
  {:else}
    <div class="results">
      { #if gameStatus == 'win'}
        <p> Игрок {notActivePlayer} победил </p>
        {:else}
        <p>Ничья</p>
      {/if}
      <button class="btn" on:click={restart}>Начать новую игру</button>
    </div>
  {/if}
</div>