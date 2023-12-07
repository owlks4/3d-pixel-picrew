import * as THREE from 'three';
import './style.css';

			import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

			let container, clock;
			let camera, scene, renderer;

      const REND_WIDTH = 128;
      const REND_HEIGHT = 128;

			const api = { state: 'Walking' };

      const tabsDomElement = document.getElementById("tabs");

      class SlotData {
        constructor(name){
          this.name = name;
          this.modelPath = null;
          let newTab = document.createElement("p");
          newTab.setAttribute("class","tab")
          newTab.setAttribute("id",this.name);
          newTab.innerText = this.name;
          tabsDomElement.appendChild(newTab);
        }
      }

      let Slot = {
        SHOES:  new SlotData("SHOES",   null),
        SOCKS:  new SlotData("SOCKS",   null),
        LEGS:   new SlotData("LEGS",    null),
        TORSO:  new SlotData("TORSO",   null),
        JACKET: new SlotData("JACKET",  null),
        NECK:   new SlotData("NECK",    null),
        FACE:    new SlotData("FACE",   null),
        HAIR:   new SlotData("HAIR",    null),
        HAT:   new SlotData("HAT",    null),
        PROP_LEFT_HAND:    new SlotData("PROP_LEFT_HAND",     null),
        PROP_RIGHT_HAND:    new SlotData("PROP_RIGHT_HAND",   null)        
      }

			init();
			animate();

      function spawnModelInSlot (slot, newModelPath){

        console.log("Anticipating spawn in slot: "+slot.name+"...");

        if (slot.modelPath != null){
          console.log("Removing existing item in slot: "+slot.name + "...");
          scene.remove(scene.getObjectByName(slot.name)); //remove previous model occupying that slot
          console.log("Slot should be cleared and ready for adding");
          }
        
        console.log("Spawning new model in slot: "+slot.name+"...")
        slot.modelPath = newModelPath;     

        const loader = new GLTFLoader();
				loader.load(slot.modelPath, function ( gltf ) {

					let model = gltf.scene;
          model.name = slot.name;

					scene.add( model );

				}, undefined, function ( e ) {
					console.error( e );
				} );
      }

			function init() {

				container = document.getElementById("three");

        let ratio = (REND_HEIGHT/REND_WIDTH);
        let orthographicSize = 1.44935064934;

				camera = new THREE.OrthographicCamera( -orthographicSize, orthographicSize, ratio*orthographicSize, ratio * -orthographicSize, 2, 500 );
				camera.position.set( 0, 2, -5.7 );
				camera.lookAt( 0, 0.75, 0 );

				scene = new THREE.Scene();
				scene.background = new THREE.Color(0x000000, 0);
				scene.fog = new THREE.Fog( 0xe0e0e0, 20, 100 );

				clock = new THREE.Clock();

				// lights

				const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
				hemiLight.position.set( 0, 20, 0 );
				scene.add( hemiLight );

				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
				dirLight.position.set( 0, 5, -10 );
				scene.add( dirLight );

				// model
        
				spawnModelInSlot(Slot.LEGS,'models/gltf/Person.glb');

				renderer = new THREE.WebGLRenderer( { alpha: true } );  
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( REND_WIDTH, REND_HEIGHT );
        renderer.domElement.id = "rend";
				container.appendChild( renderer.domElement );

				window.addEventListener( 'resize', onWindowResize );
			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
			}

			//

			function animate() {

				const dt = clock.getDelta();

				requestAnimationFrame( animate );

				renderer.render( scene, camera );
			}