<script>
  import { fade } from 'svelte/transition';
  import Cell from './Cell.svelte';

  export let scale;
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

  .row {
    display: flex;
  }
</style>

<main class="board" transition:fade>
  {#each scaleArr as {}, row}
    <div class="row">
      {#each scaleArr as {}, col}
        <Cell {row} {col} on:step></Cell>
      {/each}
    </div>
  {/each}
</main>
