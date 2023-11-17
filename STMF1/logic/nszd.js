import { tempLoc, tempVal, refreshTempData } from "./fetchData.js";
import { linhar_fit } from "./linear_harmonic_fit.js";

export var subsIndex = 3;
export var subsNames = ["Outro", "Benzeno", "Octano", "Gasolina", "Diesel", "Biodiesel"];
export var subsEnergy = [48000, 47400, 52000, 46000, 45000, 38000]; // J/g specific energy

export function setSubsEnergy(value){
    subsEnergy[0] = value;
}

export function setSubsIndex(index){
    subsIndex = index;
}

// a cubic interpolant
class Interpolant {
    constructor() {
        this.x0 = 0;
        this.x1 = 0;
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
    }
    setup(x0, x1, y0, y1, dydx0, dydx1) {
        var dx = x1 - x0;
        this.x0 = x0;
        this.x1 = x1;
        this.a = y0;
        this.b = dydx0;
        this.c = 6 * (y1 - y0 - dydx0 * dx) / (dx * dx) - 2 * (dydx1 - dydx0) / dx;
        this.d = 2 * (dydx1 - dydx0 - this.c * dx) / dx;
    }
    f(x) {
        var dx = x - this.x0;
        return this.a + dx * (this.b + dx * (this.c / 2 + this.d * dx / 6));
    }
    dfdx(x) {
        var dx = x - this.x0;
        return this.b + dx * (this.c + this.d * dx / 2);
    }
}

class Curve {
    constructor(x, y) { // allocate with number of segments
        this.idx = 0;
        this.x = []; // control points domain
        this.y = []; // control points range
        this.interp = []; // list of interpolants
    }
    // recalculate interpolants
    update(x, y) {
        this.x = x;
        this.y = y;
        // calculate interpolants
        for (var i = 0; i < x.length - 1; i++) {
            var dydx0, dydx1;
            if (i == 0) {
                dydx0 = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
                dydx1 = (y[i + 2] - y[i]) / (x[i + 2] - x[i]);
            } else if (i == x.length - 2) {
                dydx0 = (y[i + 1] - y[i - 1]) / (x[i + 1] - x[i - 1]);
                dydx1 = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
            } else {
                dydx0 = (y[i + 1] - y[i - 1]) / (x[i + 1] - x[i - 1]);
                dydx1 = (y[i + 2] - y[i]) / (x[i + 2] - x[i]);
            }
            if (!this.interp[i]) {
                this.interp[i] = new Interpolant();
            }
            this.interp[i].setup(x[i], x[i + 1], y[i], y[i + 1], dydx0, dydx1);
        }
    }
    // find index of interpolant
    find_idx(x) {
        if (x >= this.interp[this.idx].x0 && x <= this.interp[this.idx].x1) {
            return true;
        } else if (x < this.interp[this.idx].x0) {
            if (this.idx == 0) {
                // console.log("Curve.find_idx: ", x, " Below domain");
                return false;
            } else {
                this.idx--;
                this.find_idx(x);
            }
        } else if (x > this.interp[this.idx].x1) {
            if (this.idx == this.interp.length - 1) {
                // console.log("Curve.find_idx: ", x, " Above domain");
                return false;
            } else {
                this.idx++;
                this.find_idx(x);
            }
        } else {
            console.log("Curve.find_idx: Undefined behavior");
            return false;
        }
    }
    // calculate function
    f(x) {
        this.find_idx(x);
        return this.interp[this.idx].f(x);
    }
    // calculate derivative
    dfdx(x) {
        this.find_idx(x);
        return this.interp[this.idx].dfdx(x);
    }
}

// an interpolant for the temperature
var thermCurve = new Curve();

class Soil {
    // create a default soil
    constructor() {
        this.phi = 0.3;  // porosity
        this.kSat = 1.02; // W/mK saturated thermal conductivity
        this.cSat = 3.5e6; // J/m3K saturated volumetric heat capacity
        this.zw = -10;   // water level
        this.Sr = 0.01;   // residual water sat
        this.vg_alpha = 3.3; // van Genuchten coeficient
        this.vg_n = 3.56; // van Genuchten exponent
    }
    waterSat(z) {
        if (z > this.zw) {
            return this.Sr + (1 - this.Sr) / Math.pow(1 + Math.pow(this.vg_alpha * (z - this.zw), this.vg_n), 1 - 1 / this.vg_n);
        } else {
            return 1.0;
        }
    }
    thermCond(z) { // thermal conductivity
        var Sw = this.waterSat(z);
        return this.kSat * Math.exp(-3.08 * this.phi * (1 - Sw) * (1 - Sw));
    }
    thermCap(z) { // volumetric heat capacity
        const cWater = 4.2e6; // J/m3K
        var Sw = this.waterSat(z);
        return this.cSat - this.phi * cWater * (1 - Sw);
    }
    thermErg(zmin, zmax, funcT) {
        const nSteps = 100; // integration steps
        const dx = (zmax - zmin) / nSteps;
        var f1 = funcT.f(zmin) * this.thermCap(zmin);
        var U = 0;
        for (var i = 1; i <= nSteps; i++) {
            var f2 = funcT.f(zmin + i * dx) * this.thermCap(zmin + i * dx);
            U += (f1 + f2) * dx / 2;
            f1 = f2;
        }
        return U;
    }
    // this quantity is only for calculating change, do not use its individual value
    thermErgWater(zmin, funcT){
        if (zmin > this.zw) return 0;
        // calc volume of water
        const cWater = 4.2e6; // J/m3K
        var Tbtm = funcT.f(zmin);
        return (this.zw - zmin) * this.phi * cWater * Tbtm;
    }
}

export var soil = new Soil();

var flowBtm;
var flowTop;
var thermEnergy;
var thermErnergyWater;
function calcThermParams(listZ, listT, waterLevel) {
    // update water level
    soil.zw = waterLevel;
    // update inerpolant
    thermCurve.update(listZ, listT);
    // get boundary conductivity
    var kBtm = soil.thermCond(listZ[0]);
    var kTop = soil.thermCond(listZ[listZ.length - 1]);
    // calculate boundary flow
    flowBtm = kBtm * thermCurve.dfdx(listZ[0]);
    flowTop = -kTop * thermCurve.dfdx(listZ[listZ.length - 1]);
    // calculate internal energy
    thermEnergy = soil.thermErg(listZ[0], listZ[listZ.length - 1], thermCurve);
    // calculate thermal energy of water inside the volume
    thermErnergyWater = soil.thermErgWater(listZ[0], thermCurve);

    //console.log("flowBtm: ", flowBtm);
    //console.log("flowTop: ", flowTop);
    //console.log("thermErnergy:", thermEnergy);
}

export function calcDepletion(date, time, waterLevel, 
                            listMass, listHeat, listEnergy,
                            listFlowBtm, listFlowTop, listErg,
                            date_model, erg_model) {
    console.log("calculating depletion");
    var flow0 = 0;
    var flowTop0 = 0;
    var U0 = 0;
    var Uw0 = 0;
    var t0 = 0;
    var relHeat = 0;
    var ergBalance = 0;
    var prevMass = 0;
    for (var i = 0; i < time.length; i++) {
        refreshTempData(i);
        calcThermParams(tempLoc, tempVal, waterLevel[i]);
        listFlowBtm[i] = flowBtm;
        listFlowTop[i] = flowTop;
        listEnergy[i] = thermEnergy;
        var flow1 = flowBtm + flowTop;
        var flowTop1 = flowTop;
        var U1 = thermEnergy;
        var Uw1 = thermErnergyWater;
        var t1 = time[i];
        if (!isNaN(flow1) && !isNaN(U1)) {
            if (flow0 == 0 && U0 == 0) { // first measurement
                flow0 = flow1;
                flowTop0 = flowTop1;
                U0 = U1;
                Uw0 = Uw1;
                t0 = t1;
            } else { // regular measurement
                relHeat += 0.5 * (flowTop0 + flowTop1) * (t1 - t0);
                ergBalance += 0.5 * (flow0 + flow1) * (t1 - t0) - (Uw1 - Uw0) + (U1 - U0);
                flow0 = flow1;
                U0 = U1;
                Uw0 = Uw1;
                t0 = t1;
            }
        }
        listHeat[i] = relHeat/1e6; // J->MJ
        var newMass = relHeat / subsEnergy[subsIndex];
        if (newMass > prevMass){
            listMass[i] = newMass;
            prevMass = newMass;
        } else {
            listMass[i] = prevMass;
        }
        listErg[i] = ergBalance/1e6; // J->MJ
        //console.log("progress", 100*i/(time.length-1), "%");
    }
    // pass released heat to lihar_fit
    linhar_fit.setup(listHeat, time, date);
    // adjust model to fit data
    linhar_fit.optimize();
    for (var i=0; i<linhar_fit.Dm.length; i++){
        date_model[i] = linhar_fit.Dm[i];
        erg_model[i] = linhar_fit.Fm[i];
    }
    // print model list
    //console.log("error model: ", linhar_fit.err_fit);
    //console.log("model: ", linhar_fit.Me);
    //console.log("measurements: ", linhar_fit.Sm);

    console.log("mass list ready ");
}