// Import libraries
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@7.11.1/rhino3dm.module.js";

import { RhinoCompute } from "https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js";
import { Rhino3dmLoader } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js";

const definitionName = "LLF_pav_mesh.gh";

///////////////////// SLIDERS /////////////////////
const center_slider = document.getElementById("center");
center_slider.addEventListener("mouseup", onSliderChange, false);
center_slider.addEventListener("touchend", onSliderChange, false);

const end_slider = document.getElementById("end");
end_slider.addEventListener("mouseup", onSliderChange, false);
end_slider.addEventListener("touchend", onSliderChange, false);

const collision_slider = document.getElementById("collision");
collision_slider.addEventListener("mouseup", onSliderChange, false);
collision_slider.addEventListener("touchend", onSliderChange, false);

const skin_slider = document.getElementById("skin");
skin_slider.addEventListener("mouseup", onSliderChange, false);
skin_slider.addEventListener("touchend", onSliderChange, false);

///////////////////// DOWNLOAD BUTTON /////////////////////
const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download


///////////////////// 3DM LOADER /////////////////////
const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
  //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.

  RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.

  ///////////////////// LOAD GH FILE! /////////////////////
  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

  init();
  compute();
});

async function compute() {
  const param1 = new RhinoCompute.Grasshopper.DataTree("center"); // NAME AS IN GH TREE !!
  param1.append([0], [center_slider.valueAsNumber]);

  const param2 = new RhinoCompute.Grasshopper.DataTree("end"); // NAME AS IN GH TREE !!
  param2.append([0], [end_slider.valueAsNumber]);

  const param3 = new RhinoCompute.Grasshopper.DataTree("collision"); // NAME AS IN GH TREE !!
  param3.append([0], [collision_slider.valueAsNumber]);

  const param4 = new RhinoCompute.Grasshopper.DataTree("skin"); // NAME AS IN GH TREE !!
  param4.append([0], [skin_slider.valueAsNumber]);

  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);
  trees.push(param3);
  trees.push(param4);

  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );


  //console.log(res);
  doc = new rhino.File3dm();

  // hide spinner
  document.getElementById("loader").style.display = "none";

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);
        doc.objects().add(rhinoObject, null);
      }
    }
  }

  // go through the objects in the Rhino document
  let objects = doc.objects();
  for ( let i = 0; i < objects.count; i++ ) {
  
    const rhinoObject = objects.get( i );
     // asign geometry userstrings to object attributes
    if ( rhinoObject.geometry().userStringCount > 0 ) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
      
    }
  }

  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {

    // go through all objects, check for userstrings and assing colors
   object.traverse(function (child) {
      if (child.isMesh) {
          const material = new THREE.MeshNormalMaterial({ flatShading: true })
          child.material = material
          //child.material.receiveShadow = true;
      }
   })

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}

///////////////////// SCENE, CAMERA, RENDER /////////////////////
let scene, camera, renderer, controls, material;

function init() {

  THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 )

  //// SCENE
  scene = new THREE.Scene();
  scene.background = new THREE.Color('lightblue');

  //// CAMERA
  camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set( 0, 0, 150 );

  //// RENDERER
  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer( {antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  //renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);


  //// LIGHTS
  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
	  hemiLight.position.set( 0, 100, 0 );
	  scene.add( hemiLight );

	const dirLight = new THREE.DirectionalLight( 0xffffff );
		dirLight.position.set( 0, 10, 100 );
		scene.add( dirLight );
    

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  scene.traverse(function(child){
    if (child.isMesh){
        
    }else{
    }})
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}

// download button handler
function download () {
  let buffer = doc.toByteArray()
  let blob = new Blob([ buffer ], { type: "application/octect-stream" })
  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = 'LLF_pav_mesh.gh'
  link.click()
}