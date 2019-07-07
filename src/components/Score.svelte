<script>
  export let matches = 0;
  export let wins = {};
</script>

<style>
  header {
    display: flex;
    flex-direction: column;
  }

  h1 {
    text-align: center;
    font-size: 25px;
  }

  .info {
    display: flex;
    justify-content: space-between;
    background-color: #3498db;
    color: #fff;
  }
  span {
    margin: 10px;
  }
</style>

<header>
  <h1>
    Крестики нолики
  </h1>
  <div class="info">
    <span>
    0 победил {wins.O} раз
    </span>
    <span>
      Матч № {matches}
    </span>
    <span>
      X победил {wins.X} раз
    </span> 
  </div>
</header>