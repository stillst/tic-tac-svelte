<script>
  import { createEventDispatcher } from 'svelte';

  export let gameStatus;
  export let player;
  const dispatch = createEventDispatcher();

  function restart() {
    dispatch('restart');
  }
</script>
<style>
  .results {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 10px;
  }
</style>
<div class="results">
  { #if gameStatus == 'win'}
    <p> Игрок {player} победил </p>
    {:else}
    <p>Ничья</p>
  {/if}
  <button class="btn" on:click={restart}>Начать новую игру</button>
</div>
