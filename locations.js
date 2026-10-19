// ── MIDDLE-EARTH LOCATION MANIFEST ───────────────────────────────────────────
// This is the ONLY file you edit when adding a new location.
// world.html never needs to change.
//
// Each entry:
//   src:    path to the JS file, relative to world.html
//   global: the name passed to window.X = X at the bottom of that file
//
// The engine loads each file on demand — only when the player first
// visits or transitions to that location. Subsequent visits are instant
// (the module is cached in memory for the session).

const LOCATION_MANIFEST = {
  weathertop:  { src:'weathertop.js',      global:'Weathertop'  },
  barrowdowns: { src:'loc_barrowdowns.js', global:'BarrowDowns' },
  rivendell:   { src:'rivendell.js',       global:'Rivendell'   },
  eregion:     { src:'eregion.js',         global:'Eregion'     },
  moriadoors:  { src:'moria-doors.js',     global:'MoriaDoors'  },
  moriabridge: { src:'moriabridge.js',     global:'MoriaBridge' },
  // bree:     { src:'bree.js',            global:'Bree'        },
  // shire:    { src:'shire.js',           global:'Shire'       },
  // moria:    { src:'moria.js',           global:'Moria'       },
};
