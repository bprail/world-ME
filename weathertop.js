// ── WEATHERTOP LOCATION MODULE ───────────────────────────────────────────────
// Amon Sûl · The Watchtower
// Drop this file alongside world.html. The engine calls build() once on load.

const Weathertop = (() => {

  // ── Terrain ────────────────────────────────────────────────────────────────
  const HILL_R=30, PLATEAU_R=13, HILL_H=22;

  function hillHeight(x,z){
    const d=Math.sqrt(x*x+z*z);
    if(d>HILL_R) return api_fbm(x*0.025,z*0.025)*0.6;
    let h;
    if(d<PLATEAU_R){
      h=HILL_H-(d/PLATEAU_R)*(d/PLATEAU_R)*0.6;
    } else {
      const t=(d-PLATEAU_R)/(HILL_R-PLATEAU_R);
      const sm=t*t*(3-2*t);
      h=(1-sm)*HILL_H;
    }
    const nf=Math.min(1,Math.max(0,(d-PLATEAU_R*0.6)/(HILL_R-PLATEAU_R)));
    h+=api_fbm(x*0.20,z*0.20)*1.8*nf;
    return h;
  }

  // ── Path ───────────────────────────────────────────────────────────────────
  const pathWaypoints=[
    [ 4, 50],[ 4, 36],[-14,30],[-16,26],
    [ 12,20],[ 14,16],[  4,15],[  0,13],[0,0]
  ];

  function onPath(x,z){
    let minD=999;
    for(let i=0;i<pathWaypoints.length-1;i++){
      const [ax,az]=pathWaypoints[i],[bx,bz]=pathWaypoints[i+1];
      const dx=bx-ax,dz=bz-az,len2=dx*dx+dz*dz;
      const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/len2));
      const px=ax+t*dx,pz=az+t*dz;
      minD=Math.min(minD,Math.sqrt((x-px)**2+(z-pz)**2));
    }
    return Math.max(0,1-minD/2.5);
  }

  // ── Vertex colour helper ───────────────────────────────────────────────────
  function vertexColor(vx,vy,vz,noise2d,lerp){
    const vd=Math.sqrt(vx*vx+vz*vz);
    let cr,cg,cb;
    if(vd>HILL_R){
      const mn=noise2d(vx*0.04,vz*0.04);
      cr=lerp(0.095,0.130,mn); cg=lerp(0.085,0.115,mn); cb=lerp(0.060,0.085,mn);
    } else {
      const vt=Math.min(1,Math.max(0,vy/HILL_H));
      cr=lerp(0.18,0.36,vt); cg=lerp(0.14,0.34,vt); cb=lerp(0.10,0.30,vt);
    }
    return [cr,cg,cb];
  }

  // ── Module export ──────────────────────────────────────────────────────────
  return {
    name:     'Weathertop',
    subtitle: 'Amon Sûl · The Watchtower',

    atmosphere: {
      fogColor:    0x06080e,
      fogDensity:  0.009,
      skyColor:    0x04060c,
      ambientColor:0x08090f,
      ambientIntensity: 1.4,
      moonColor:   0x6878a8,
      moonIntensity:0.42,
      moonPosition:{x:-80,y:100,z:-60},
    },

    pathWaypoints,
    onPath,
    hillHeight,
    vertexColor,

    lorePoints:[
      {pos:{x:0,z:40}, radius:8,
        text:'"The Road wound away before them like a piece of string."',
        cite:'— The Fellowship of the Ring'},
      {pos:{x:8,z:19}, radius:5,
        text:'"Weathertop! We shall reach it by noon, if we go on. Shall we?"',
        cite:'— Aragorn, The Fellowship of the Ring'},
      {pos:{x:1,z:6},  radius:4,
        text:'"Amon Sûl — here once stood the great tower of the Dúnedain, and the chief Palantír of the North."',
        cite:'— The Fellowship of the Ring'},
      {pos:{x:0,z:0},  radius:3.5,
        text:'"A ring of ancient stone. In the midst of it Frodo saw a small fire of wood."',
        cite:'— The Fellowship of the Ring'},
    ],

    start: { x:0, z:45, yaw:0 },
    boundary: 85,

    transitions:[
      // South boundary → Bree (future)
      { trigger:{x:0,z:78,radius:8}, to:'bree',
        arrivalOffset:{x:0,z:-8} },
    ],
    
    arrivals: {
      barrowdowns: { x:0, z:70, yaw:0 },  // arrive on the plain south of the hill
    },

    // Called by engine after terrain mesh is built and groundY is live
    buildScene(THREE, scene, groundY, MAT){
      const { STONE, STONE_DARK, STONE_MOSS } = MAT;

      function box(x,y,z,w,h,d,mat=STONE,ry=0){
        const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
        m.position.set(x,y,z); m.rotation.y=ry;
        m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
      }

      // ── Wall ring ──────────────────────────────────────────────────────────
      const WALL_R=13, SEGS=24;
      function lerp(a,b,t){return a+t*(b-a);}
      for(let i=0;i<SEGS;i++){
        const a=(i/SEGS)*Math.PI*2, na=((i+1)/SEGS)*Math.PI*2;
        const mid=a+(na-a)*0.5;
        const mx=Math.cos(mid)*WALL_R, mz=Math.sin(mid)*WALL_R;
        const base=groundY(mx,mz);
        if(Math.random()<0.32){
          for(let g=0;g<Math.floor(Math.random()*3)+1;g++){
            const ga=a+(na-a)*Math.random(), gr=WALL_R+(Math.random()-0.5)*2.2;
            const gx=Math.cos(ga)*gr, gz=Math.sin(ga)*gr;
            const gb=groundY(gx,gz), gs=0.2+Math.random()*0.4;
            box(gx,gb+gs*0.25,gz,gs*1.3,gs*0.45,gs*0.8,STONE_DARK,Math.random()*Math.PI);
          }
          continue;
        }
        const bc=Math.random()<0.4?2:1;
        for(let b=0;b<bc;b++){
          const t0=b/bc, t1=(b+0.82)/bc;
          const bmid=lerp(a,na,(t0+t1)/2);
          const bx=Math.cos(bmid)*WALL_R, bz=Math.sin(bmid)*WALL_R;
          const bb=groundY(bx,bz);
          const sL=2*Math.PI*WALL_R/SEGS*(t1-t0)*1.05;
          const wH=0.5+Math.random()*0.5;
          box(bx,bb+wH/2,bz,1.0,wH,sL,Math.random()<0.3?STONE_MOSS:STONE,bmid+Math.PI/2);
        }
      }

      // ── Standing stones ────────────────────────────────────────────────────
      const STONES=[
        [0.3,10.5,0.60,2.8,0.75, 0.04,-0.03],[1.0,11.8,0.52,2.2,0.65, 0.00, 0.05],
        [1.8,10.2,0.72,3.4,0.80,-0.06, 0.02],[2.7,11.5,0.48,1.9,0.60, 0.03, 0.00],
        [3.6,10.8,0.65,3.0,0.78, 0.00,-0.06],[4.5,11.2,0.55,2.5,0.68,-0.04, 0.04],
        [5.3,10.4,0.68,2.7,0.72, 0.05, 0.02],
        [0.6, 9.8,0.80,1.4,1.00, 0.00, 0.00],[1.5,12.0,0.50,1.2,0.60, 0.08,-0.04],
        [3.2, 9.9,0.85,1.6,0.95,-0.05, 0.00],[4.9,11.6,0.60,1.3,0.65, 0.00, 0.07],
        [4.0,10.8,0.55,0.35,2.5, 0.00, 0.00],
      ];
      STONES.forEach(([ang,rad,sw,sh,sd,lx,lz])=>{
        const sx=Math.cos(ang)*rad, sz=Math.sin(ang)*rad;
        const sb=groundY(sx,sz);
        const mat=Math.random()<0.4?STONE_MOSS:STONE_DARK;
        const m=new THREE.Mesh(new THREE.CylinderGeometry(sw*0.38,sw*0.55,sh,9,1),mat);
        m.position.set(sx,sb+sh/2-sh*0.25,sz);
        m.rotation.y=ang+Math.PI/2+(Math.random()-0.5)*0.3;
        m.rotation.x=lx; m.rotation.z=lz;
        m.castShadow=true; m.receiveShadow=true; scene.add(m);
      });

      // ── Tower remnants ─────────────────────────────────────────────────────
      for(let i=0;i<5;i++){
        const t=i/4, ang=lerp(-0.5,0.5,t)+Math.PI;
        const r=6+Math.sin(t*Math.PI)*1.0;
        const tx=Math.cos(ang)*r, tz=Math.sin(ang)*r;
        const tb=groundY(tx,tz), th=1.4+Math.random()*1.2;
        const m=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.65,th,8,1),STONE_DARK);
        m.position.set(tx,tb+th/2-th*0.2,tz);
        m.rotation.y=ang; m.castShadow=true; m.receiveShadow=true; scene.add(m);
      }

      // Collapsed heap SW
      [[0.0,0.0,1.7,0.5,2.0],[1.1,0.0,1.3,0.4,1.5],[-0.9,0.0,1.5,0.38,1.8],
       [0.4,0.42,1.0,0.35,1.2],[-0.3,0.38,0.85,0.30,1.1],[1.6,0.0,0.7,0.28,0.9],
      ].forEach(([dx,dy,bw,bh,bd])=>{
        const hx=-5+dx, hz=4+dx*0.3, hb=groundY(hx,hz);
        box(hx,hb+dy+bh/2,hz,bw,bh,bd,STONE_DARK,Math.random()*Math.PI);
      });

      // ── Gateway ────────────────────────────────────────────────────────────
      const gatZ=12.5, gatX=0.0, gatY=groundY(gatX,gatZ), pH=3.6;
      const lp=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.38,pH,9,1),STONE_DARK);
      lp.position.set(gatX-2.4,gatY+pH/2-pH*0.2,gatZ);
      lp.rotation.y=0.12; lp.castShadow=true; lp.receiveShadow=true; scene.add(lp);
      const rph=pH*0.8;
      const rp=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.34,rph,9,1),STONE_DARK);
      rp.position.set(gatX+2.0,gatY+rph/2-rph*0.2,gatZ);
      rp.rotation.z=0.07; rp.rotation.y=-0.15; rp.castShadow=true; rp.receiveShadow=true; scene.add(rp);
      const lintel=new THREE.Mesh(new THREE.BoxGeometry(5.0,0.40,0.70),STONE_DARK);
      lintel.position.set(gatX+0.2,gatY+pH*0.78,gatZ+0.25);
      lintel.rotation.z=-0.22; lintel.rotation.y=0.07;
      lintel.castShadow=true; lintel.receiveShadow=true; scene.add(lintel);
      const ks=new THREE.Mesh(new THREE.SphereGeometry(0.42,10,7),STONE_DARK);
      ks.position.set(gatX-0.5,gatY+0.18,gatZ-0.8);
      ks.scale.y=0.55; ks.rotation.set(0.4,1.1,0.3); scene.add(ks);

      // ── Rubble ─────────────────────────────────────────────────────────────
      for(let i=0;i<45;i++){
        const a=Math.random()*Math.PI*2, rv=Math.random()*12.5;
        const rx=Math.cos(a)*rv, rz=Math.sin(a)*rv;
        if(onPath(rx,rz)>(1-1.2/2.5)) continue;
        const rb=groundY(rx,rz);
        if(Math.random()<0.5){
          const sw=0.15+Math.random()*0.7,sh=0.1+Math.random()*0.25,sd=0.12+Math.random()*0.5;
          box(rx,rb+sh*0.25,rz,sw,sh,sd,STONE_DARK,Math.random()*Math.PI);
        } else {
          const s=0.08+Math.random()*0.35;
          const m=new THREE.Mesh(new THREE.SphereGeometry(s,8,6),STONE_DARK);
          m.position.set(rx,rb+s*0.4,rz);
          m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
          scene.add(m);
        }
      }

      // ── Slope boulders ─────────────────────────────────────────────────────
      for(let i=0;i<20;i++){
        const a=Math.random()*Math.PI*2, r=16+Math.random()*12;
        const bx=Math.cos(a)*r, bz=Math.sin(a)*r;
        if(onPath(bx,bz)>0.0) continue;
        const bb=groundY(bx,bz), s=0.5+Math.random()*1.3;
        const m=new THREE.Mesh(new THREE.SphereGeometry(s,10,7),STONE_DARK);
        m.position.set(bx,bb+s*0.45,bz);
        m.scale.y=0.55+Math.random()*0.3; m.scale.x=0.85+Math.random()*0.3;
        m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
        m.castShadow=true; scene.add(m);
      }

      // ── Moorland boundary walls & heath ────────────────────────────────────
      const wallMat=new THREE.MeshLambertMaterial({color:0x1e1c18,emissive:0x040403});
      const wallSegs=[
        {x:-60,z:10,len:35,ang:0.2},{x:20,z:-55,len:28,ang:1.4},
        {x:55,z:30,len:40,ang:0.05},{x:-30,z:55,len:32,ang:1.1},
      ];
      wallSegs.forEach(({x,z,len,ang})=>{
        const advX=Math.cos(ang+Math.PI/2), advZ=Math.sin(ang+Math.PI/2);
        const perpX=Math.cos(ang), perpZ=Math.sin(ang);
        let cx=x, cz=z, walked=0;
        const wallBearing=Math.atan2(advX,advZ);
        while(walked<len){
          const gap=Math.random()*0.8; cx+=advX*gap; cz+=advZ*gap; walked+=gap;
          if(walked>=len) break;
          const bl=1.5+Math.random()*3.0, bh=0.35+Math.random()*0.55, bt=0.5+Math.random()*0.4;
          const jitter=(Math.random()-0.5)*0.5;
          const bx2=cx+perpX*jitter, bz2=cz+perpZ*jitter;
          const gy=groundY(bx2,bz2);
          const rot=wallBearing+(Math.random()-0.5)*0.25;
          const m=new THREE.Mesh(new THREE.BoxGeometry(bt,bh,bl),wallMat);
          m.position.set(bx2,gy+bh*0.35,bz2); m.rotation.y=rot;
          m.rotation.x=(Math.random()-0.5)*0.07; m.rotation.z=(Math.random()-0.5)*0.05;
          m.receiveShadow=true; m.castShadow=true; scene.add(m);
          cx+=advX*(bl+0.1); cz+=advZ*(bl+0.1); walked+=bl+0.1;
        }
      });

      const heathMat=new THREE.MeshLambertMaterial({color:0x181712,emissive:0x030302});
      for(let i=0;i<40;i++){
        const a=Math.random()*Math.PI*2, r=32+Math.random()*45;
        const hx=Math.cos(a)*r, hz=Math.sin(a)*r, hy=groundY(hx,hz);
        const s=0.3+Math.random()*0.8;
        const hm=new THREE.Mesh(new THREE.SphereGeometry(s,10,7),heathMat);
        hm.position.set(hx,hy+s*0.2,hz);
        hm.scale.y=0.28+Math.random()*0.18;
        hm.scale.x=hm.scale.z=0.9+Math.random()*0.6;
        hm.rotation.y=Math.random()*Math.PI; scene.add(hm);
      }

      // Road
      const roadGeo=new THREE.PlaneGeometry(4,500,1,1);
      roadGeo.rotateX(-Math.PI/2);
      const road=new THREE.Mesh(roadGeo,new THREE.MeshLambertMaterial({color:0x161411}));
      road.rotation.y=0.35; road.position.set(55,0.05,0); road.receiveShadow=true; scene.add(road);

      // ── Fire ───────────────────────────────────────────────────────────────
      const fireBase=groundY(0,0)+0.12;
      const fireLight=new THREE.PointLight(0xff6820,7.0,13,2);
      fireLight.position.set(0,fireBase+1.0,0);
      fireLight.castShadow=true; fireLight.shadow.mapSize.set(512,512); scene.add(fireLight);
      const fireFill=new THREE.PointLight(0xff4400,0.5,18,2);
      fireFill.position.set(0,fireBase+0.5,0); scene.add(fireFill);

      // Campfire stones
      [[0.0,0.55,0.18],[0.85,0.68,0.22],[1.9,0.56,0.15],[2.8,0.63,0.20],
       [3.9,0.48,0.25],[4.8,0.70,0.16],[5.6,0.58,0.21],[6.3,0.43,0.14]
      ].forEach(([a,r,sr])=>{
        const m=new THREE.Mesh(new THREE.SphereGeometry(sr,10,7),STONE);
        m.position.set(Math.cos(a)*r,fireBase+sr*0.55,Math.sin(a)*r);
        m.scale.y=0.7+Math.random()*0.3;
        m.rotation.set(Math.random()*0.4,Math.random()*Math.PI,Math.random()*0.4);
        scene.add(m);
      });

      // Log cross
      for(let i=0;i<2;i++){
        const l=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,1.0,6),
          new THREE.MeshLambertMaterial({color:0x2a1a0c}));
        l.position.set(0,fireBase+0.14,0); l.rotation.z=Math.PI/2; l.rotation.y=i*Math.PI/2;
        scene.add(l);
      }

      // Flame sprites
      function makeFlameTexture(c1,c2){
        const cv=document.createElement('canvas'); cv.width=cv.height=64;
        const ctx=cv.getContext('2d');
        const g=ctx.createRadialGradient(32,40,2,32,32,30);
        g.addColorStop(0,c1); g.addColorStop(0.5,c2); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,64,64);
        return new THREE.CanvasTexture(cv);
      }
      const flames=[];
      [{tex:makeFlameTexture('rgba(255,240,180,0.95)','rgba(255,100,10,0.6)'),sz:1.1,speed:1.2,phase:0},
       {tex:makeFlameTexture('rgba(255,160,30,0.85)','rgba(200,40,0,0.4)'),  sz:0.85,speed:0.9,phase:1},
       {tex:makeFlameTexture('rgba(255,200,80,0.7)', 'rgba(180,60,0,0.2)'),  sz:1.3, speed:1.5,phase:2.1},
      ].forEach(cfg=>{
        const mat=new THREE.SpriteMaterial({map:cfg.tex,transparent:true,
          blending:THREE.AdditiveBlending,depthWrite:false});
        const sp=new THREE.Sprite(mat);
        sp.position.set(0,fireBase+cfg.sz*0.5,0); sp.scale.set(cfg.sz,cfg.sz*1.6,1);
        sp.userData.baseY=sp.position.y; scene.add(sp); flames.push({sprite:sp,mat,baseY:sp.position.y,...cfg});
      });

      // Embers
      const EC=120;
      const eGeo=new THREE.BufferGeometry();
      const ePOS=new Float32Array(EC*3), eVEL=[], eLIF=new Float32Array(EC);
      function resetE(i){
        const a=Math.random()*Math.PI*2,r=Math.random()*0.3;
        ePOS[i*3]=Math.cos(a)*r; ePOS[i*3+1]=fireBase+0.4+Math.random()*0.3;
        ePOS[i*3+2]=Math.sin(a)*r;
        eVEL[i]=new THREE.Vector3((Math.random()-0.5)*0.5,1.2+Math.random()*1.8,(Math.random()-0.5)*0.5);
        eLIF[i]=Math.random();
      }
      for(let i=0;i<EC;i++) resetE(i);
      eGeo.setAttribute('position',new THREE.BufferAttribute(ePOS,3));
      const eMat=new THREE.PointsMaterial({color:0xffaa22,size:0.08,transparent:true,
        opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
      scene.add(new THREE.Points(eGeo,eMat));

      return { fireLight, fireFill, flames, embers:{EC,eGeo,ePOS,eVEL,eLIF,resetE} };
    },

    // Per-frame animation — called by engine game loop
    onFrame(t, dt, refs){
      const {fireLight,fireFill,flames,embers:{EC,eGeo,ePOS,eVEL,eLIF,resetE}}=refs;
      const fl=0.85+Math.sin(t*7.3)*0.08+Math.sin(t*13.1)*0.05+Math.sin(t*3.7)*0.04;
      fireLight.intensity=7.0*fl;
      fireLight.color.setHSL(0.06+Math.sin(t*4)*0.01,1,0.52+Math.sin(t*9)*0.04);
      fireFill.intensity=0.5*fl;
      flames.forEach(f=>{
        const s=f.sz*(0.88+Math.sin(t*f.speed*5+f.phase)*0.12);
        f.sprite.scale.set(s,s*(1.5+Math.sin(t*f.speed*3+f.phase+1)*0.2),1);
        
          // fireBase embedded in sprite — just animate the Y offset
          (f.sprite.position.y - f.sz*0.5);
        f.mat.opacity=0.75+Math.sin(t*f.speed*6+f.phase)*0.2;
      });
      for(let i=0;i<EC;i++){
        eLIF[i]+=dt*0.4;
        if(eLIF[i]>1){resetE(i);continue;}
        ePOS[i*3]  +=eVEL[i].x*dt*(1-eLIF[i]*0.6);
        ePOS[i*3+1]+=eVEL[i].y*dt*(1-eLIF[i]*0.5);
        ePOS[i*3+2]+=eVEL[i].z*dt*(1-eLIF[i]*0.6);
        ePOS[i*3]  +=Math.sin(t*0.8+i*0.3)*0.01;
      }
      eGeo.attributes.position.needsUpdate=true;
    },
  };
})();

// Expose for engine
if(typeof module!=='undefined') module.exports=Weathertop;
window.Weathertop=Weathertop;