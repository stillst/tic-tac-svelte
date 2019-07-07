<script>
  import Cell from './Cell.svelte';

  export let scale;
  export let activePlayer;
  let scaleArr = [];
  
  $: for (let i = 0; i < scale; i++) { 
    scaleArr.push(i);
  }
</script>

<style>
  .board {
    display: flex;
    flex-direction: column;
    padding: 5px;
    max-width: 900px;
    overflow-x: scroll;
  }
  .row {
    display: flex;
  }
</style>

<main>
  <div class="board">
    {#each scaleArr as {}, row}
      <div class="row">
        {#each scaleArr as {}, col}
          <Cell {row} {col} {activePlayer} on:step></Cell>
        {/each}
      </div>
    {/each}
  </div>
</main>