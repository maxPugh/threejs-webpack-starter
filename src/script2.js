import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";
import Perlin from "./perlin";
import { Vector3 } from "three";

var hardWidth = 1400,
  hardHeight = 900;
var scene, camera, renderer;
var geometry, sea;
var target, width, height, size;
var t;
var perlin;
var water, loader, sphere, sphere2;
var rainGeo,
  rainCount = 9000,
  rainMaterial,
  rain;
var rainVel = [];
var rainX = [];
var controls;
target = document.querySelector("div.wave");
width = target.offsetWidth;
height = target.offsetHeight;
size = width > height ? width : height;
t = 0;
perlin = new Perlin();
var seaDarkness;
var index = 0;
var boatArr = [];
var boatPosArr = [];

var boatNum = 3;

const tools = {
  randBetween: (max, min) => {
    return Math.random() * (max - min) + min;
  },
  addBoat: (num) => {
    const boatLoader = new GLTFLoader();
    boatLoader.load(
      "./ship.gltf",
      function (gltf) {
        // let boatRotation = gltf.scene.rotation;
        // boatRotation.x = THREE.Math.degToRad(70);
        // boatRotation.y = THREE.Math.degToRad(40);
        gltf.scene.name = "boat";
        // scene.add(gltf.scene);

        //. loop numbers and clone the boat and add to an array
        for (let i = 0; i < num; i++) {
          let boat = gltf.scene.clone();
          boat.name = "boat-" + i;
          boatArr.push(boat);
          boat.scale.set(0.1, 0.1, 0.1);
          scene.add(boat);
        }

        console.log(boatArr);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );
  },
  addLight: () => {
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.x = -500;
    pointLight.position.y = 3;
    pointLight.position.z = 6000;
    scene.add(pointLight);
  },
  addFog: () => {
    scene.fog = new THREE.Fog(0xc1cdd9, 250, 1200); //0xdfe9f3
  },
  addSea: () => {
    //SEA
    geometry = new THREE.PlaneBufferGeometry(hardWidth, hardHeight, 50, 50);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      // flatShading: true,
      vertexColors: true,
      // wireframe: true,
      map: water,
    });
    sea = new THREE.Mesh(geometry, material);
    scene.add(sea);
  },
  addRain: () => {
    rainGeo = new THREE.BufferGeometry();
    let verts = [];

    for (let i = 0; i < rainCount; i++) {
      let x = Math.random() * 1600 - 800;
      let y = Math.random() * 100 - 400;
      let z = Math.random() * 500,
        rainDrop = [x, y, z];

      verts.push(...rainDrop);
      rainX.push(x);
      rainVel.push(tools.randBetween(8, 4));
    }
    rainGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(verts), 3)
    );
    rainMaterial = new THREE.PointsMaterial({
      color: 0x6c94b8,
      size: 1.2, //tools.randBetween(1.5, 0.8),
      transparent: true,
    });
    rain = new THREE.Points(rainGeo, rainMaterial);
    scene.add(rain);
  },
  makeWaves: (geom) => {
    var vertices = geom.geometry.attributes.position.array;

    let divide = 150;
    let times = 20;
    let position;

    for (let i = 0; i <= vertices.length; i += 3) {
      position =
        perlin.noise(vertices[i] / divide + t, vertices[i + 1] / divide + t) *
        times;

      vertices[i + 2] = position;

      if (i % 10 == 0) {
        vertices[i + 2] += 6;
      }
    }
  },
  placeBoat: (object) => {
    const placementPosition = sea.geometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(placementPosition, 1200);

    let scaleFactor = 2.5;
    object.scale.set(scaleFactor, scaleFactor, scaleFactor);
    object.position.set(vertex.x, vertex.y, vertex.z - 4);
  },
  placeBoats: () => {
    const placementPosition = sea.geometry.getAttribute("position");
    const position = [1200, 1040, 1440]; //1200, 1040, 1440
    const vertex = new THREE.Vector3();

    for (let i = 0; i < boatNum; i++) {
      let boat = boatArr[i];

      // vertex.fromBufferAttribute(placementPosition, position[i]);
      vertex.fromBufferAttribute(placementPosition, boatPosArr[i]);
      let scaleFactor = 2.5;
      boat.scale.set(scaleFactor, scaleFactor, scaleFactor);
      boat.position.set(vertex.x, vertex.y, vertex.z - 4);
    }
  },
  addSphere: () => {
    let sphereG = new THREE.SphereBufferGeometry(5, 8, 6);
    let sphereM = new THREE.MeshStandardMaterial({
      color: "red",
      transparent: true,
      opacity: 0,
    });
    sphere = new THREE.Mesh(sphereG, sphereM);
    scene.add(sphere);
  },
  viewPoints: () => {
    // let sphereG = new THREE.SphereGeometry(hardWidth / 4, 10, 10);
    // let sphereM = new THREE.MeshStandardMaterial({
    //   color: "red",
    //   transparent: false,
    //   opacity: 1,
    // });
    // let sphere = new THREE.Mesh(sphereG, sphereM);
    // scene.add(sphere);

    let center = new THREE.Vector3(0, 200, 0);
    let calcSphere = new THREE.Sphere(center, hardWidth / 5);

    let seaPos = sea.geometry.getAttribute("position");
    let count = seaPos.count;

    let vertex = new THREE.Vector3();
    let pointsArr = [];

    for (let i = 0; i < count; i++) {
      vertex.fromBufferAttribute(seaPos, i);

      if (calcSphere.containsPoint(vertex)) {
        //this is the index used in placing on the sea
        pointsArr.push(i);
      }
    }

    for (let i = 0; i < boatNum; i++) {
      //random index in the pointsArr
      let index = Math.ceil(tools.randBetween(pointsArr.length - 1, 0));
      boatPosArr.push(pointsArr[index]);
    }
    console.log(pointsArr, boatPosArr);
  },
  sinRotation: (object) => {
    let sinArr = [];
    for (let i = 1; i < 629; i++) {
      let angleRange = 10;
      sinArr.push(Math.sin(i / 100) * angleRange);
    }

    let angle = THREE.Math.degToRad(sinArr[index]);

    if (Boolean(index % 1 == 0)) object.rotation.z = angle;
  },
  depthColoring: (geom) => {
    const count = geom.geometry.attributes.position.count;
    geom.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3)
    );

    let color = new THREE.Color();

    //looping for coloring based on z
    for (let i = 0; i < count; i++) {
      let height = geom.geometry.attributes.position.getZ(i);

      let oldMin = -60;
      let oldRange = 60 - oldMin;
      let newMin = seaDarkness;
      let newRange = 0 - newMin;

      let newValue = ((height - oldMin) * newRange) / oldRange + newMin;

      // color.setHSL(0.6, 1, newValue);

      color = new THREE.Color(`hsl(198, 100%, ${Math.ceil(newValue)}%)`);

      geom.geometry.attributes.color.setXYZ(i, color.r, color.g, color.b);
    }
    geom.geometry.attributes.position.needsUpdate = true;
  },
  makeItRain: () => {
    const positionAttribute = rain.geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i++) {
      let z = positionAttribute.getZ(i);
      let x = positionAttribute.getX(i);

      if (z < -1) {
        positionAttribute.setZ(i, 400);
        positionAttribute.setX(i, rainX[i]);
        continue;
      }

      let vel = rainVel[i];
      z -= vel;
      x -= tools.randBetween(1, 3.5);

      positionAttribute.setZ(i, z);
      positionAttribute.setX(i, x);
    }

    positionAttribute.needsUpdate = true;
  },
  handleBoatRotation: (boat) => {
    let { x, y, z } = boat.position;
    let boatPos = new THREE.Vector3(x, y, z);

    let calcSphere = new THREE.Sphere(boatPos, 45);

    let seaPos = sea.geometry.getAttribute("position");
    let count = seaPos.count;

    let vertex = new THREE.Vector3();
    let topRight = 0;

    for (let i = 0; i < count; i++) {
      vertex.fromBufferAttribute(seaPos, i);

      if (calcSphere.containsPoint(vertex) && vertex.x > x && vertex.y > y) {
        topRight = i;
      }
    }

    vertex.fromBufferAttribute(seaPos, topRight);
    sphere.position.set(vertex.x, vertex.y, vertex.z);
    boat.lookAt(vertex);
    // boat.rotation.x = THREE.Math.degToRad(70);

    //. Handle boat rotation

    // let rotationMatrix = new THREE.Matrix4();
    //find the position of the targeted vertex
    // rotationMatrix.lookAt(boat position, target position, target up)
    // targetQuaternion.setRotationFromMatrix(rotationMatrix)
    //boat.quaternion.rotateTowards(targetQuaternion, step)
  },
};

function init() {
  seaDarkness = 20;
  loader = new THREE.TextureLoader();
  water = loader.load("/water3.jpg");
  // const gui = new dat.GUI();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1.6, 1, 10000);
  camera.position.set(0, -742, 300);
  camera.rotation.x = THREE.Math.degToRad(66);

  renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(1490, 900);

  tools.addBoat(boatNum);
  tools.addLight();

  tools.addFog();

  target.appendChild(renderer.domElement);

  // controls = new OrbitControls(camera, renderer.domElement);
}

function createGeometry() {
  tools.addSea();
  tools.addSphere();
  tools.addRain();
  tools.viewPoints();

  // //generate tooltips and objects on each vert of water
  // var size = 1;
  // var vertGeometry = new THREE.BoxGeometry(size, size, size);
  // var vertMaterial = new THREE.MeshBasicMaterial({
  //   color: 0x0000ff,
  //   transparent: false,
  // });

  // var vertArr = geometry.attributes.position.array;
  // for (let k = 0; k < vertArr.length; k += 3) {
  //   var vertMarker = new THREE.Mesh(vertGeometry, vertMaterial);

  //   // this is how tooltip text is defined for each box
  //   let tooltipText = `idx: ${k}, pos: [${vertArr[k].toFixed(3)},${vertArr[
  //     k + 1
  //   ].toFixed(3)},${vertArr[k + 2].toFixed(3)}]`;
  //   // vertMarker.userData.tooltipText = tooltipText;

  //   vertMarker.applyMatrix4(
  //     new THREE.Matrix4().makeTranslation(
  //       vertArr[k],
  //       vertArr[k + 1],
  //       vertArr[k + 2]
  //     )
  //   );
  //   scene.add(vertMarker);
  //   // tooltipEnabledObjects.push(vertMarker);
  // }
}

function updateVertices(geom) {
  tools.makeWaves(geom);

  //coloring in the water based on z
  tools.depthColoring(geom);
}

function animate() {
  requestAnimationFrame(animate);

  //incrementing
  t += 0.001;
  index = index === 627 ? 0 : index + 0.5;

  tools.makeItRain();

  updateVertices(sea);

  // tools.handleBoatRotation(boat);

  tools.placeBoats();

  boatArr.forEach((boat) => tools.handleBoatRotation(boat));

  // console.log(boatArr);

  renderer.render(scene, camera);
}

init();
createGeometry();
animate();
