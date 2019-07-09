<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  let scale = 3;

  function startGame() {
    dispatch('start', scale);
  }
</script>

<style>
  form {
    background: #f3f3f3;
    padding: 10px;
  }

  form, label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  input {
    width: 60px;
    min-height: 35px;
    font-size: 18px;
    border: 1px solid #ced4da;
    border-radius: 2px;
    text-align: center;
  }
  span {
    margin-right: 5px;
  }
</style>

<form on:submit|preventDefault={startGame}>
  <label>
    <span>Размер поля:</span><input type="number" required min="3" max="15" bind:value="{scale}">
  </label>
  <button class="btn" type="submit">Начать игру</button>
</form>
