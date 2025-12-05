import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";

let camera, scene, renderer, controls;
let physicsWorld;
let rigidBodies = [];
let transformAux1, tempBtVec3_1;
let clock = new THREE.Clock();

// Bola
let ballMesh = null;
let ballBody = null;

// Flecha futurista
let arrowMesh = null;
let arrowAngle = 0;
let arrowDirection = 1;
const arrowMin = -Math.PI / 3;
const arrowMax = Math.PI / 3;
let arrowSpeed = 0.6;

let aiming = true;
let charging = false;
let chargePower = 0;
const maxCharge = 60;
const speedFactor = 5;

let canLaunch = true;

// Barra de potencia
const powerContainer = document.createElement("div");
powerContainer.style.position = "absolute";
powerContainer.style.top = "20px";
powerContainer.style.left = "20px";
powerContainer.style.width = "30px";
powerContainer.style.height = "150px";
powerContainer.style.border = "2px solid #fff";

const powerBarDiv = document.createElement("div");
powerBarDiv.style.width = "100%";
powerBarDiv.style.height = "0%";
powerBarDiv.style.background = "linear-gradient(to top, green, yellow, red)";

powerContainer.appendChild(powerBarDiv);
document.body.appendChild(powerContainer);

Ammo(Ammo).then(start);

function start() {
  initGraphics();
  initPhysics();
  createLane();
  createPins();
  createBall();
  createArrow();
  initInput();
  animationLoop();
}

/* ------------------- GRÁFICOS ------------------- */
function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  camera.position.set(-15, 10, 25);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  window.addEventListener("resize", onWindowResize);
}

/* ------------------- FÍSICA ------------------- */
function initPhysics() {
  const config = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(config);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    config
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));

  transformAux1 = new Ammo.btTransform();
  tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
}

/* ------------------- OBJETOS ------------------- */
function createLane() {
  const pos = new THREE.Vector3(0, -0.5, 0);
  const quat = new THREE.Quaternion();
  createBox(
    20,
    1,
    60,
    0,
    pos,
    quat,
    new THREE.MeshStandardMaterial({ color: 0x444444 })
  );
}

function createPins() {
  const mat = new THREE.MeshPhongMaterial({ color: 0xffffff });

  const pinRadiusTop = 0.6;
  const pinRadiusBottom = 0.8;
  const pinHeight = 3;
  const mass = 2;

  const rows = [
    { count: 1, z: -20 },
    { count: 2, z: -23 },
    { count: 3, z: -26 },
    { count: 4, z: -29 },
  ];

  rows.forEach((row) => {
    for (let i = 0; i < row.count; i++) {
      const x = (i - (row.count - 1) / 2) * 2;
      const y = pinHeight / 2;
      const z = row.z;
      createCylinder(
        pinRadiusTop,
        pinRadiusBottom,
        pinHeight,
        mass,
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(),
        mat
      );
    }
  });
}

/* ------------------- BOLA ------------------- */
function createBall() {
  const radius = 1.2;
  const pos = new THREE.Vector3(0, radius + 0.1, 15);
  const quat = new THREE.Quaternion();
  const geo = new THREE.SphereGeometry(radius, 32, 32);
  const mat = new THREE.MeshPhongMaterial({ color: 0x0080ff });
  ballMesh = new THREE.Mesh(geo, mat);
  ballMesh.castShadow = true;
  scene.add(ballMesh);

  const shape = new Ammo.btSphereShape(radius);
  shape.setMargin(0.05);
  ballBody = createRigidBody(ballMesh, shape, 5, pos, quat);
}

/* ------------------- FLECHA ------------------- */
function createArrow() {
  const arrowGroup = new THREE.Group();

  const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 16);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = -1.5;
  arrowGroup.add(shaft);

  const headGeo = new THREE.ConeGeometry(0.15, 0.5, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.rotation.x = -Math.PI / 2;
  head.position.z = -3;
  arrowGroup.add(head);

  scene.add(arrowGroup);
  arrowMesh = arrowGroup;
}

function updateArrow(delta) {
  if (!aiming || !arrowMesh || !ballMesh) return;

  const arrowOffsetY = 0.1;
  const arrowOffsetZ = -1;
  arrowMesh.position.set(
    ballMesh.position.x,
    arrowOffsetY,
    ballMesh.position.z + arrowOffsetZ
  );

  arrowAngle += arrowDirection * arrowSpeed * delta;
  if (arrowAngle > arrowMax) {
    arrowAngle = arrowMax;
    arrowDirection = -1;
  }
  if (arrowAngle < arrowMin) {
    arrowAngle = arrowMin;
    arrowDirection = 1;
  }

  arrowMesh.rotation.y = arrowAngle;
}

/* ------------------- POTENCIA ------------------- */
function updatePowerBar() {
  if (!charging) return;
  const percent = Math.min(chargePower / maxCharge, 1);
  powerBarDiv.style.height = `${percent * 100}%`;
}

/* ------------------- INPUT ------------------- */
function initInput() {
  window.addEventListener("keydown", (e) => {
    if (e.key === " " && aiming) {
      aiming = false;
      charging = true;
      chargePower = 0;
    }
    if (charging && e.key === " ") {
      chargePower += 0.4;
      if (chargePower > maxCharge) chargePower = maxCharge;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (charging && e.key === " ") {
      charging = false;
      launchBall();
    }
  });
}

/* ------------------- LANZAMIENTO ------------------- */
function launchBall() {
  if (!canLaunch) return;

  const fx = -Math.sin(arrowAngle) * chargePower * speedFactor;
  const fz = -Math.cos(arrowAngle) * chargePower * speedFactor;
  const force = new Ammo.btVector3(fx, 0, fz);

  ballBody.activate(true);
  ballBody.applyCentralImpulse(force);

  if (arrowMesh) scene.remove(arrowMesh);

  aiming = false;
  charging = false;
  chargePower = 0;
  powerBarDiv.style.height = "0%";

  canLaunch = false;
}

/* ------------------- FÍSICA ------------------- */
function createBox(sx, sy, sz, mass, pos, quat, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.copy(pos);
  mesh.quaternion.copy(quat);
  mesh.receiveShadow = true;
  scene.add(mesh);
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx / 2, sy / 2, sz / 2));
  shape.setMargin(0.05);
  return createRigidBody(mesh, shape, mass, pos, quat);
}

function createCylinder(rTop, rBottom, height, mass, pos, quat, mat) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, height, 16),
    mat
  );
  mesh.castShadow = true;
  mesh.position.copy(pos);
  scene.add(mesh);
  const shape = new Ammo.btCylinderShape(
    new Ammo.btVector3(rTop, height / 2, rTop)
  );
  return createRigidBody(mesh, shape, mass, pos, quat);
}

function createRigidBody(mesh, shape, mass, pos, quat) {
  mesh.position.copy(pos);
  mesh.quaternion.copy(quat);
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);
  const localInertia = new Ammo.btVector3(0, 0, 0);
  if (mass > 0) shape.calculateLocalInertia(mass, localInertia);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    shape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);
  if (mass > 0) {
    rigidBodies.push(mesh);
    body.setActivationState(4);
  }
  physicsWorld.addRigidBody(body);
  mesh.userData.physicsBody = body;
  return body;
}

/* ------------------- ANIMACIÓN ------------------- */
function updatePhysics(delta) {
  physicsWorld.stepSimulation(delta, 10);
  rigidBodies.forEach((obj) => {
    const body = obj.userData.physicsBody;
    const motionState = body.getMotionState();
    if (!motionState) return;
    motionState.getWorldTransform(transformAux1);
    const p = transformAux1.getOrigin();
    const q = transformAux1.getRotation();
    obj.position.set(p.x(), p.y(), p.z());
    obj.quaternion.set(q.x(), q.y(), q.z(), q.w());
  });
}

function animationLoop() {
  const delta = clock.getDelta();
  updatePhysics(delta);
  updateArrow(delta);
  updatePowerBar();
  renderer.render(scene, camera);
  requestAnimationFrame(animationLoop);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
