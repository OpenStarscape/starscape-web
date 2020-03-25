<template>
  <div>
  </div> 
</template>

<script>
import * as THREE from "three";

export default {
  name: 'ShipView',
  data() {
    return {
      element: null
    };
  },

  methods: {
    init: function() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth/window.innerHeight,
        0.1,
        1000
      );

      camera.position.z = 10;

      const renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.setClearColor("#efefef");
      renderer.setSize(window.innerWidth, window.innerHeight);

      this.element.appendChild(renderer.domElement);

      const geometry = new THREE.SphereGeometry(5, 32, 32);
      const material = new THREE.MeshBasicMaterial({color: 0xffff00});
      const mesh = new THREE.Mesh(geometry, material);
      const light = new THREE.PointLight(0xffffff, 1, 1000);
      const light2 = new THREE.PointLight(0xfffff, 1, 1000);

      mesh.position.z = 10;
      light2.position.x = 50;
      light2.position.y = 50;

      scene.add(mesh);
      scene.add(light);
      scene.add(light2);

      const render = function() { 
        requestAnimationFrame(render);
        renderer.render(scene, camera);
      }

      render();

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
  html, body {
    margin:0;
    padding:0;
  }

  #container {
    width: 100%;
    height:100%;
  }
</style>
