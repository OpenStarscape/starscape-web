<template>
  <div>
  </div> 
</template>

<script>
import State from '../lib/State.js';
import SpaceScene from '../graphics/SpaceScene.js';

export default {
  name: 'ShipView',
  data() {
    return {
      element: null,
      state: null,
      scene: null,
    };
  },

  methods: {
    init: function() {
      this.state = new State();
      this.scene = new SpaceScene(this.state, this.element);
    }
  },

  created() {
    this.element = document.body;
    this.init();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
