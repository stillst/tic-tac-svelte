<script>
  import { activePlayer } from '../store.js';
  import { fade } from 'svelte/transition';
  import Cell from './Cell.svelte';

  export let scale;
  export let moves;

  let scaleArr = [];

  $: for (let i = 0; i < scale; i++) {
    scaleArr.push(i);
  }
</script>

<style>
  .board {
    display: flex;
    flex-direction: column;
    padding: 15px;
    max-width: 900px;
    overflow-x: auto;
  }

  .info {
    text-align: center;
  }

  .row {
    display: flex;
  }
</style>

<main class="board" transition:fade>
  <p class="info">
    Ход №{moves} игрок - {$activePlayer}
  </p>
  {#each scaleArr as {}, row}
    <div class="row">
      {#each scaleArr as {}, col}
        <Cell {row} {col} on:step></Cell>
      {/each}
    </div>
  {/each}
</main>
