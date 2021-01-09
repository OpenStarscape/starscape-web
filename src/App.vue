<template>
  <div id="app">
    <ShipView></ShipView>
  </div>
</template>

<script>
import ShipView from './components/ShipView.vue'; 

export default {
  name: 'OpenStarscape',
  data() {
    return {};
  },
  components: {
    ShipView
  }
}
</script>

<style>
  body {
    margin: 0;
    height: 100%;
  }

  canvas {
    display:block;
  }

  .body-label {
    color: #FFFFFF;
    font-family: sans-serif;
    font-weight: bold;
    padding: 0.2em;
    background: rgba(0, 0, 0, 0.5);
  }
</style>
