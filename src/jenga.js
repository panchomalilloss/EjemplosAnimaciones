import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";

let camera, controls, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// Materiales y Geometría
const blockMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });

// Mundo físico con Ammo
let physicsWorld;
const gravityConstant = 9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
const margin = 0.05;

// Objetos rígidos
const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
// Variables temporales
let transformAux1;

// --- VARIABLES GLOBALES PARA DRAG & DROP ---
let pickedBody = null; // Cuerpo rígido de Ammo seleccionado
let mouseConstraint = null; // Restricción P2P de Ammo activa
const intersectionPoint = new THREE.Vector3(); // Punto 3D donde se agarró el bloque

// Inicialización ammo
Ammo(Ammo).then(start);

function start() {
  initGraphics();
  initPhysics();
  createObjects();
  initInput();
  animationLoop();
}

// ----------------------------------------------------
// CONFIGURACIÓN VISUAL Y FÍSICA
// ----------------------------------------------------

function initGraphics() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  // Ajuste de cámara para la torre más grande
  camera.position.set(15, 20, 20);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  // Ajuste de objetivo para la torre más grande
  controls.target.set(0, 7, 0);
  controls.update();

  textureLoader = new THREE.TextureLoader();

  const ambientLight = new THREE.AmbientLight(0x707070);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(-10, 18, 5);
  light.castShadow = true;
  const d = 25; // Aumentar el tamaño de la sombra
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;
  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;
  scene.add(light);

  window.addEventListener("resize", onWindowResize);
}

function initPhysics() {
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
}

function createObjects() {
  // SUELO BASE (Masa 0, estático)
  pos.set(0, -0.25, 0);
  quat.set(0, 0, 0, 1);
  const suelo = createBoxWithPhysics(
    30,
    0.5,
    30,
    0,
    pos,
    quat, // Suelo más grande para la torre más grande
    new THREE.MeshPhongMaterial({ color: 0xeeeeee })
  );
  suelo.receiveShadow = true;

  // CREAR LA TORRE JENGA
  createJengaTower();
}

function createJengaTower() {
  const blockMass = 0.8; // Más masa para más estabilidad
  const blockHeight = 0.7; // Más gruesas que 0.5
  const blockWidth = 2.0; // Más anchas que 1.5
  const blockLength = 6.0; // Más largas que 5.0

  const numLevels = 15; // Un poco menos de niveles para compensar el tamaño

  for (let i = 0; i < numLevels; i++) {
    const isRotated = i % 2 !== 0;
    const levelY = i * blockHeight + blockHeight / 2;

    if (isRotated) {
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    } else {
      quat.set(0, 0, 0, 1);
    }

    // El espaciado se ajusta al nuevo ancho
    const positions = [-blockWidth * 1.05, 0, blockWidth * 1.05];

    for (let j = 0; j < 3; j++) {
      let x, z;

      if (isRotated) {
        x = 0;
        z = positions[j];
      } else {
        x = positions[j];
        z = 0;
      }

      pos.set(x, levelY, z);

      const block = createBoxWithPhysics(
        blockWidth,
        blockHeight,
        blockLength,
        blockMass,
        pos,
        quat,
        blockMaterial
      );
      block.castShadow = true;
      block.receiveShadow = true;
    }
  }
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1),
    material
  );

  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  shape.setMargin(margin);

  createRigidBody(object, shape, mass, pos, quat);

  return object;
}

function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  if (pos) {
    object.position.copy(pos);
  } else {
    pos = object.position;
  }
  if (quat) {
    object.quaternion.copy(quat);
  } else {
    quat = object.quaternion;
  }

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  // Propiedades de fricción y rebote, cruciales para Jenga
  body.setFriction(0.95); // Aumentar fricción para mayor estabilidad
  body.setRestitution(0.05); // Disminuir rebote

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }
  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  object.userData.physicsBody = body;
  object.userData.collided = false;
  object.userData.mass = mass;

  scene.add(object);

  if (mass > 0) {
    rigidBodies.push(object);
    body.setActivationState(4);
  }

  physicsWorld.addRigidBody(body);
  return body;
}

// ----------------------------------------------------
// MANEJO DE INPUT (AGARRAR Y ARRASTRAR)
// ----------------------------------------------------

function initInput() {
  window.addEventListener("pointerdown", onPointerDown, false);
  window.addEventListener("pointermove", onPointerMove, false);
  window.addEventListener("pointerup", onPointerUp, false);
}

function onPointerDown(event) {
  if (mouseConstraint) return;

  mouseCoords.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(mouseCoords, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const targetObject = intersects[0].object;

    if (targetObject.userData.physicsBody && targetObject.userData.mass > 0) {
      pickedBody = targetObject.userData.physicsBody;

      intersectionPoint.copy(intersects[0].point);

      // 2. Crear la Restricción P2P

      const localPoint = new Ammo.btVector3(
        intersectionPoint.x - targetObject.position.x,
        intersectionPoint.y - targetObject.position.y,
        intersectionPoint.z - targetObject.position.z
      );

      mouseConstraint = new Ammo.btPoint2PointConstraint(
        pickedBody,
        localPoint
      );

      // Mantener un umbral de rotura alto
      const maxImpulse = 200.0;
      mouseConstraint.setBreakingImpulseThreshold(maxImpulse * maxImpulse);

      physicsWorld.addConstraint(mouseConstraint);

      pickedBody.setActivationState(1); // ACTIVE_TAG

      // Deshabilitar temporalmente los controles orbitales
      controls.enabled = false;
    }
  }
}

function onPointerMove(event) {
  if (!mouseConstraint) return;

  mouseCoords.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(mouseCoords, camera);

  // Calcular la nueva posición 3D: Proyectamos el rayo a través de la distancia original
  const distance = camera.position.distanceTo(intersectionPoint);

  raycaster.ray.at(distance, pos);

  // Actualizar la posición objetivo (el "pivot B") de la restricción
  mouseConstraint.setPivotB(new Ammo.btVector3(pos.x, pos.y, pos.z));
}

function onPointerUp() {
  if (!mouseConstraint) return;

  // 1. Eliminar la restricción del mundo físico
  physicsWorld.removeConstraint(mouseConstraint);

  // 2. Limpiar variables
  mouseConstraint = null;
  pickedBody = null;
  intersectionPoint.set(0, 0, 0);

  // Reactivar los controles orbitales
  controls.enabled = true;
}

// ----------------------------------------------------
// BUCLE DE ANIMACIÓN
// ----------------------------------------------------

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  renderer.render(scene, camera);
}

function updatePhysics(deltaTime) {
  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = 0, il = rigidBodies.length; i < il; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();

    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}
