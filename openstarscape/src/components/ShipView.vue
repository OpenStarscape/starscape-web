<template>
  <div>
  </div> 
</template>

<script>
import * as THREE from "three";
import { TrackballControls } from "../lib/TrackballControls.js";

export default {
  name: 'ShipView',
  data() {
    return {
      element: null,
      scene: null,
      camera: null,
      renderer: null,
      ship: null,
      light: null,
      lightController: null,
      cameraController: null,
    };
  },

  methods: {
    randRange: function(start, end) {
      start = Math.floor(start);
      end = Math.ceil(end);

      return Math.floor(Math.random() * (end - start + 1)) + start;
    },

    addStars: function() {
      console.log("ADD STARS");
      const RAND_RANGE_START = -1000;
      const RAND_RANGE_END = 1000;

      for(let i = 0; i < 500; i++) {
        const dotGeometry = new THREE.Geometry();
        const dotMaterial = new THREE.PointsMaterial();
        const dot = new THREE.Points(dotGeometry, dotMaterial);
        
        dotGeometry.vertices.push(new THREE.Vector3());

        dot.position.x = this.randRange(RAND_RANGE_START, RAND_RANGE_END);
        dot.position.y = this.randRange(RAND_RANGE_START, RAND_RANGE_END);
        dot.position.z = this.randRange(RAND_RANGE_START, RAND_RANGE_END);
        
        this.scene.add(dot);
      }
    },

		createShip: function() {
      const ship = new THREE.ConeGeometry(2, 10, 50, 10);
      const material = new THREE.MeshStandardMaterial({color: 0xff00ff, side: THREE.DoubleSide});
      const mesh = new THREE.Mesh(ship, material);
     
      this.ship = mesh;
      this.scene.add(mesh);
		},

    addLights: function() {
      console.log("ADDED LIGHTS");
      this.light = new THREE.PointLight(0xffffff, 1, 1000);
      this.light.position.z = 10;
      this.scene.add(this.light);
    },

    addControllers: function() {
      console.log("ADDED CONTROLLER");
      this.lightController = new TrackballControls(this.light);
      this.cameraController = new TrackballControls(this.camera);
    },

    move: function(obj, direction) {
      obj.position.x += direction.x;
      obj.position.y += direction.y;
      obj.position.z += direction.z;
    },

    render: function() {
      this.lightController.update();
      this.cameraController.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.render);
    },
    
    init: function() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({antialias: true});
      
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;

      camera.position.z = 100;

      renderer.setClearColor("#000000");
      renderer.setSize(window.innerWidth, window.innerHeight);

      this.element.appendChild(renderer.domElement);
      
      this.createShip();
      this.addLights();
      this.addControllers();
      this.addStars();

      document.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      });

      this.render();

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
