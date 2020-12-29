<template>
  <div>
  </div> 
</template>

<script>
import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import StarscapeConnection from "../lib/Starscape.js";
import State from "../lib/State.js";
import { makeBody } from "../graphics/Body.js";

export default {
  name: 'ShipView',
  data() {
    return {
      element: null,
      scene: null,
      camera: null,
      renderer: null,
      ship: null,
      cameraController: null,
      connection: null,
      state: null,
      attachedToShip: null,
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

        let position = new THREE.Vector3(
          this.randRange(RAND_RANGE_START, RAND_RANGE_END),
          this.randRange(RAND_RANGE_START, RAND_RANGE_END),
          this.randRange(RAND_RANGE_START, RAND_RANGE_END));
        position.normalize()
        position.multiplyScalar(this.randRange(300, 1000));
        dot.position.x = position.x;
        dot.position.y = position.y;
        dot.position.z = position.z;
        
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

    addControllers: function() {
      console.log("ADDED CONTROLLER");
      this.cameraController = new TrackballControls(this.camera, this.renderer.domElement);
    },

    move: function(obj, direction) {
      obj.position.x += direction.x;
      obj.position.y += direction.y;
      obj.position.z += direction.z;
    },

    render: function() {
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

      this.addControllers();
      this.addStars();

      this.connection = new StarscapeConnection();
      this.state = new State();
      this.state.getProperty(this.connection.god.property('bodies'), bodies => {
        bodies.forEach(obj => {
          makeBody(this.state, obj, body => {
            this.scene.add(body.mesh);
            //if (!this.currentShip && body.isShip()) {
              //body.mesh.attach(this.camera);
              //this.currentShip = body;
              //this.camera.position.set(0.0, 0.0, 20.0);
              //this.camera.rotation.set(0.0, 0.0, 0.0);
            //}
          });
        });
        this.state.fireAction(this.connection.god.action('create_ship'), [
          new THREE.Vector3(20000, 60000, 0),
          new THREE.Vector3(0, 0, 10000),
        ]);
      });
      this.state.subscribeProperty(this.connection.god.event('ship_created'), obj => {
        makeBody(this.state, obj, body => {
          this.scene.add(body.mesh);
          if (!this.currentShip && body.isShip()) {
            body.mesh.attach(this.camera);
            this.currentShip = body;
            this.camera.position.set(0.0, 0.0, 20.0);
            this.camera.rotation.set(0.0, 0.0, 0.0);
          }
        });
      });

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
