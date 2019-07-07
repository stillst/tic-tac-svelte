<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  export let row;
  export let col;
  export let activePlayer;
  
  let active = true;
  let player = '';

  function makeStep() {
    if (active) {
      dispatch('step', { row, col });
      active = false;
      player = activePlayer;
    }
  }
</script>

<style>
  button {
    flex-shrink: 0;
    width: 110px;
    height: 110px;
    background-color: #ddd;
    border: 1px solid #000;
    margin: 1px;
    cursor: pointer;
    transition: background-color, .4s;
  }

  button:hover {
    background-color: #34495e;
  }

  .inactive {
    background-color: #ecf0f1;
    cursor: not-allowed;
    animation: pulse 1s;
  }

  .inactive.x, .inactive.o {
    position: relative;
  }

  .inactive.x:before {
    content: "";
    position: absolute;
    width: 75%;
    height: 20%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotateZ(45deg);
    background: #000;
  }

  .inactive.x:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotateZ(45deg);
    width: 20%;
    height: 75%;
    background-color: #000;
  }

  .inactive.o:before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    width: 75%;
    height: 75%;
    background: #1abc9c;
  }

  .inactive.o:after{
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    width: 50%;
    height: 50%;
    background-color: #ecf0f1;
  }

  @keyframes pulse {
    from {
      transform: scale3d(1, 1, 1);
    }

    50% {
      transform: scale3d(1.1, 1.1, 1.1);
    }

    to {
      transform: scale3d(1, 1, 1);
    }
  }
</style>

<button 
  class:inactive={!active} 
  class:x={player === 'X'} 
  class:o={player === 'O'} 
  on:click="{makeStep}"
>
</button>