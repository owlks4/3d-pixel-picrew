import * as THREE from 'three';
import { decode, encode } from 'fast-png';
import './style.css';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, clock;
let camera, scene, renderer;

const REND_WIDTH = 128;
const REND_HEIGHT = 128;

const tabsDomElement = document.getElementById("tabs");
const animationChooserDomElement = document.getElementById("animationChooser");

const animations = ["Idle","Walking","Running"];

for (let i = 0; i < animations.length; i++){
	let newElement = document.createElement("option");
	newElement.id = animations[i] + "Option";
	newElement.value = animations[i];
	newElement.innerText = animations[i];
	animationChooserDomElement.appendChild(newElement);
}


let outputSpriteSheetData = {}; // see the following lines:
									//An object representing the image, with the following properties:
									//	width - The width of the image
									//	height - The height of the image
									//	data - An array or TypedArray with the image data
									//	depth - A number indicating the color depth (only 8 and 16 are supported now). Defaults to 8.
									//	channels - Number of channels, including alpha (1, 2, 3 and 4 are supported). Defaults to 4.

document.getElementById("tempButton").onclick = () => {renderToSpriteSheet()};

//set up html events
document.getElementById("leftButton").onclick = () => {rotateFigureYawBy(-22.5)};
document.getElementById("rightButton").onclick = () => {rotateFigureYawBy(22.5)};
document.getElementById("animationChooser").onchange = () => {playAnimation(animationChooserDomElement.value)};

function playAnimation(anim){
	alert("Just so you know, the animations are currently placeholders to make sure that the system is working")
	Object.keys(Slot).forEach(function(key,index) {
		Slot[key].playAnimation(anim);
	});
}

class SlotData {
    constructor(name){
    	this.name = name;
        this.modelPath = null;
		this.clips = null;
		this.mixer = null;
        let newTab = document.createElement("p");
        newTab.setAttribute("class","tab")
        newTab.setAttribute("id",this.name);
        newTab.innerText = this.name;          
        tabsDomElement.appendChild(newTab);
    }

	playAnimation(anim){
		if (this.clips == null){
			return;
		}
		const clip = THREE.AnimationClip.findByName(this.clips, anim);

		if (clip == null){
			alert("There is no animation with the name '"+anim+"' in the model.\nIs your capitalisation correct?");
		}

		this.mixer.stopAllAction();
		this.mixer.clipAction( clip ).play();
		console.log("playing animation "+anim);
	}
}

let Slot = {
    SHOES:  new SlotData("Shoes",   null),
    SOCKS:  new SlotData("Socks",   null),
    LEGS:   new SlotData("Legs",    null),
    TORSO:  new SlotData("Torso",   null),
    JACKET: new SlotData("Jacket",  null),
    NECK:   new SlotData("Neck",    null),
    FACE:   new SlotData("Face",   	null),
    HAIR:   new SlotData("Hair",    null),
    HAT:   	new SlotData("Hat",    	null),
    PROP_LEFT_HAND:   new SlotData("Left hand",     null),
    PROP_RIGHT_HAND:  new SlotData("Right hand",   null)        
    }

init();
animate();

function spawnModelInSlot (slot, newModelPath){

    console.log("Anticipating spawn in slot: "+slot.name+"...");

    if (slot.modelPath != null){
        console.log("Removing existing item in slot: "+slot.name + "...");
		let existing = scene.getObjectByName(slot.name);
        scene.remove(scene.getObjectByName(slot.name)); //remove previous model occupying that slot
		existing.dispose();
        console.log("Slot is now cleared and ready for adding to");
        }
    
	console.log("Something that should be done here is go through the meshes in the newly imported model, and change their material to a toon shader")

    console.log("Spawning new model in slot: "+slot.name+"...")
    slot.modelPath = newModelPath;     

    const loader = new GLTFLoader();
	
	loader.load(slot.modelPath, function (gltf) {
			let model = gltf.scene;
        	model.name = slot.name;
			slot.mixer = new THREE.AnimationMixer(model)
			slot.clips = gltf.animations;
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

	renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true});  
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

function animate() {
	const dt = clock.getDelta();
	requestAnimationFrame( animate );
	
	//updates the animations of models in the scene
	Object.keys(Slot).forEach(function(key,index) {
		let s = Slot[key];
		if (s.mixer != null){
			s.mixer.update(dt);
			}
		});

	//renders to canvas
	renderer.render( scene, camera )
	}

function deg2Rad(deg){
	return deg * Math.PI/180;
}

function rotateFigureYawBy(yawChange){
	scene.rotation.y += (deg2Rad(yawChange));
}

function renderToSpriteSheet(){
	let w;
	let h;
	let requiredDataLength;

	console.log("TODO: Calculate required width and height based on all the frames we're including, and number of bytes for the big output spritesheet's image data here")

	outputSpriteSheetData = {
		width: w,
		height: h,
		data: new Uint8Array(requiredDataLength),
		depth: 8,
		channels: 4
	}

	//then for each animation
		//for each direction it could be facing
			//for each frame in the animation
				//render it to canvas and then:
				writeCurrentCanvasFrameIntoSpriteSheetAtCoordinates(0,0)
				//may also want to record the data relating to the animation timings and position of its constituent sprites within the spriteset into a json format string as we go.

	console.log(outputSpriteSheetData.data);
}

function writeCurrentCanvasFrameIntoSpriteSheetAtCoordinates (topLeftX,topLeftY){	
	renderer.domElement.toBlob(async (blob) => {
		let arr = new Uint8Array(await blob.arrayBuffer());
		let imgData = decode(arr)
		transplantImgDataIntoImage(imgData,outputSpriteSheetData.data,topLeftX,topLeftY);
		console.log(imgData);
		console.log("write imgData into its respective position on the big output spritesheet here, using the given x and y coordinates")
	 });
}

function transplantImgDataIntoImage(src,dest,destX,destY){
	console.log(dest);
	for (let y = 0; y < src.height; y++){
		for (let x = 0; x < src.width; x++){
			dest[((destY + y) * dest.width) + destX + x] = src[(y * src.width) + x];
		}
	}
}