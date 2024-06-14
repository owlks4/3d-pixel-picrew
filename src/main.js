import * as THREE from 'three';
import { decode, encode } from 'fast-png';
import './style.css';
import GIF from "gif.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, clock;
let camera, scene, renderer;

const REND_WIDTH = 128;
const REND_HEIGHT = 128;

let FRAME_INTERVAL = 1/12; 
let lastFrameOccurredAt = 0;
document.getElementById("fps-input").onchange = (e) => {FRAME_INTERVAL = 1 / e.target.value};

const NUMBER_OF_ROTATION_STOPS = 16

const tabsDomElement = document.getElementById("tabs");
const animationChooserDomElement = document.getElementById("animationChooser");

let currentlySelectedTabDOMElement = null;
let currentlySelectedSlot = "";

const animations = ["Default","Walking","Running"];

for (let i = 0; i < animations.length; i++){
	let newElement = document.createElement("option");
	newElement.id = animations[i] + "Option";
	newElement.value = animations[i];
	newElement.innerText = animations[i];
	animationChooserDomElement.appendChild(newElement);
}

class ItemInGrid {			//clothing items etc, to appear in the grid that you can choose from.
	//When the player chooses one, its contents are transposed into the relevant SlotData on the character.
	constructor (name,path,slot){
		this.name = name;
		this.path = "models/gltf/"+path;
		this.slot = slot;
		}

	apply(){
		console.log("!")
		spawnModelInSlot(this.slot,this.path);
	}
}

let outputSpriteSheetData = {}; // see the following lines:
									//An object representing the image, with the following properties:
									//	width - The width of the image
									//	height - The height of the image
									//	data - An array or TypedArray with the image data
									//	depth - A number indicating the color depth (only 8 and 16 are supported now). Defaults to 8.
									//	channels - Number of channels, including alpha (1, 2, 3 and 4 are supported). Defaults to 4.

document.getElementById("render-button").onclick = () => { renderToGifs() };

//set up html events
document.getElementById("leftButton").onclick = () => {rotateFigureYawBy(-360/NUMBER_OF_ROTATION_STOPS)};
document.getElementById("rightButton").onclick = () => {rotateFigureYawBy(360/NUMBER_OF_ROTATION_STOPS)};
document.getElementById("animationChooser").onchange = () => {
	alert("Just so you know, the animations are currently placeholders to make sure that the system is working");
	playAnimation(animationChooserDomElement.value)
};

let colorPicker = document.getElementById("color-picker");
colorPicker.oninput = () => {
	slotColours[currentlySelectedSlot.name] = colorPicker.value;
	changeColorOfMeshesInScene(scene.getObjectByName(currentlySelectedSlot.name),colorPicker.value)
	console.log(renderer.info);
};

function playAnimation(anim){
	Object.keys(Slot).forEach(function(key,index) {
		Slot[key].playAnimation(anim);
	});
}

function selectTab(slot){
	let grid = document.getElementById("grid");
	grid.innerHTML = "";

	for (let i = 0; i < items.length; i++){
		let item = items[i];
		if (item.slot == slot){
			let newElement = document.createElement("div");
			newElement.id = item.name + "GridButton";
			
			console.log(slot.modelPath);
			console.log(item.path);
			if (slot.modelPath == item.path){
				newElement.className = "grid-button unselectable selected-tab";
			} else {
				newElement.className = "grid-button unselectable";
			}
			newElement.onclick = ()=>{console.log("?"); item.apply()};
			newElement.innerHTML = "<p class=grid-button-text>"+item.name+"</p>";
			grid.appendChild(newElement);
		}
	}
	currentlySelectedSlot = slot;
	colorPicker.value = slotColours[slot.name];
}

class SlotData {		//data that occupies a slot on the character (head/face/torso/legs etc)
    constructor(name){
    	this.name = name;
        this.modelPath = null;
		this.clips = null;
		this.mixer = null;
        let newTab = document.createElement("p");
        newTab.setAttribute("class","tab unselectable")
        newTab.setAttribute("id",this.name+"Tab");
		let slot = this;
		
		newTab.onclick = ()=>{if (currentlySelectedTabDOMElement != null){
									currentlySelectedTabDOMElement.className = "tab";
								}
								currentlySelectedTabDOMElement = newTab;
								newTab.className = "tab unselectable selected-tab";
								selectTab(slot)};

		if (currentlySelectedTabDOMElement == null){
			currentlySelectedTabDOMElement = newTab;
			newTab.className = "tab unselectable selected-tab";
		}

        newTab.innerText = this.name;          
        tabsDomElement.appendChild(newTab);
    }

	playAnimation(anim){
		if (this.clips == null){
			return;
		}
		const clip = THREE.AnimationClip.findByName(this.clips, anim);

		if (clip == null){
			console.log("There is no animation with the name '"+anim+"' in the model.\nIs your capitalisation correct?");
		} else {
			this.mixer.stopAllAction();
			this.mixer.clipAction( clip ).play();
			console.log("playing animation "+anim);
		}
	}
}

let Slot = {
    SHOES:  new SlotData("Shoes", null),
    SOCKS:  new SlotData("Socks", null),
    LEGS:   new SlotData("Legs", null),
    TORSO:  new SlotData("Torso", null),
    JACKET: new SlotData("Jacket", null),
    NECK:   new SlotData("Neck", null),
    FACE:   new SlotData("Face", null),
    HAIR:   new SlotData("Hair", null),
	HAIR_2: new SlotData("Hair 2", null),
	FRINGE: new SlotData("Fringe", null),
    HAT:   	new SlotData("Hat", null),
    PROP_LEFT_HAND:   new SlotData("Left hand", null),
    PROP_RIGHT_HAND:  new SlotData("Right hand", null)        
    }

let slotColours = {};

Object.keys(Slot).forEach(slot => {
	slotColours[Slot[slot].name] = "#ff0000"
});

const items = [
		new ItemInGrid("Person","Person.glb",Slot.LEGS),
	];

init();
currentlySelectedTabDOMElement.onclick();
animate();

function spawnModelInSlot (slot, newModelPath){

    console.log("Anticipating spawn in slot: "+slot.name+"...");

    if (slot.modelPath != null){
        console.log("Removing existing item in slot: "+slot.name + "...");
		let existing = scene.getObjectByName(slot.name);
        scene.remove(scene.getObjectByName(slot.name)); //remove previous model occupying that slot
		console.log(existing)
		existing.traverse( function( object ) {
			try{
				object.dispose(); //I'm not sure that this actually helps the memory management. You'd think it would, but it seems you have to be quite manual and thorough with ThreeJS.
			} catch {}
		});
        console.log("Slot is now cleared and ready for adding to");
        }
    
	console.log("Something that should be done here is go through the meshes in the newly imported model, and change their material to a toon shader")

    console.log("Spawning new model in slot: "+slot.name+"...")
    slot.modelPath = newModelPath;     

    const loader = new GLTFLoader();
	
	loader.load(slot.modelPath, function (gltf) {
			let model = gltf.scene;
        	model.name = slot.name;
			changeColorOfMeshesInScene(model,slotColours[slot.name])
			slot.mixer = new THREE.AnimationMixer(model)
			slot.clips = gltf.animations;
			scene.add( model );
			}, undefined, function ( e ) {
				console.error( e );
			} );
      }

	function changeColorOfMeshesInScene(scene,newColor){
		let color = new THREE.Color(newColor);
		scene.traverse( function( object ) {
			if (object.isMesh) {
				if (Array.isArray(object.material)){
					object.material.forEach(mat => {
						mat.color = color;
					});
				} else {
					object.material.color = color;
				}
			};
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
	scene.background = null;
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
	renderer.setClearColor( 0x000000, 0 ); 
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

function updateAnimationMixers(dt){
	//updates the animations of models in the scene according to a certain amount of time having passed
	Object.keys(Slot).forEach(function(key,index) {
		let s = Slot[key];
		if (s.mixer != null){
			s.mixer.update(dt);
			}
		});
}

function animate() {
	const curTime = clock.getElapsedTime();
	const dt = curTime - lastFrameOccurredAt;

	requestAnimationFrame( animate );
	
	if (dt >= FRAME_INTERVAL){
		forceRenderToCanvas(curTime, dt);
		}
	}

function forceRenderToCanvas(curTime, dt){
	lastFrameOccurredAt = curTime;
	updateAnimationMixers(dt)
	renderer.render( scene, camera )
}

function deg2Rad(deg){
	return deg * Math.PI/180;
}

function rotateFigureYawBy(yawChange){
	scene.rotation.y += (deg2Rad(yawChange));
	forceRenderToCanvas(clock.getElapsedTime(), clock.getElapsedTime() - lastFrameOccurredAt);
}

async function renderToGifs(){

	for (let a = 0; a < animations.length; a++){
		let animationName = animations[a];
		console.log("Beginning render for animation: "+animationName)

		//let animationDuration = getLongestDurationOfAnimationAcrossAnyCurrentlyEquippedOutfit();		
		alert("need to instate the above duration-finding method properly")

		let animationDuration = 5; //TEMP

		for (let i = 0; i < NUMBER_OF_ROTATION_STOPS; i++){ // and for each direction the model can face

			let deg = (i/NUMBER_OF_ROTATION_STOPS) * 360;

			scene.rotation.y = deg2Rad(deg);

			console.log("...at angle "+deg+"...");

			var gif = new GIF({
				width: REND_WIDTH,
				height: REND_HEIGHT,
				workers: 2,
				quality: 2,  //1 is best, but 2 will cut the render time nearly in half, without really reducing the visual fidelity.
				repeat: 0,
				dither: false,
				transparent: '#000'
			  });
	
			playAnimation(animationName)
			
			let time = 0;

			while (time < animationDuration) {
				//console.log("Rendering frame at time "+time)
				updateAnimationMixers(FRAME_INTERVAL);
				renderer.render( scene, camera );
				gif.addFrame(renderer.domElement, {copy: true, delay: FRAME_INTERVAL * 1000});
				time += FRAME_INTERVAL;
			}

			gif.on('finished', function(blob) {
				window.open(URL.createObjectURL(blob));
			  });
	
			gif.render();
		}
	}

	alert("Gifs will be renderered in the background by workers and presented to you in due course.")
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