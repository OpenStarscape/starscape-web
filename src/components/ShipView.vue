<template>
  <div>
  </div> 
</template>

<script>
import StarscapeConnection from '../lib/Starscape.js';
import SpaceScene from '../graphics/SpaceScene.js';

export default {
  name: 'ShipView',
  data() {
    return {
      element: null,
      connection: null,
      scene: null,
    };
  },

  methods: {
    init: function() {
      this.connection = new StarscapeConnection();
      this.scene = new SpaceScene(this.connection, this.element);
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
