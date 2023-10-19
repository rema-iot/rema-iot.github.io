import { insert_text, set_progress } from "./methods.js";
import { rawData, colNames, tempVal, tempLoc, fillColumns, fixDataUnits, refreshTempData } from "./fetchData.js";
import { calcDepletion, subsIndex, subsEnergy, subsNames, setSubsIndex, setSubsEnergy, soil } from "./nszd.js"
import { linhar_fit } from "./linear_harmonic_fit.js";

const sheetId = '1DEXfEHcYPDpwHixNWlKuEInPXm1Wm4s9mrNQVCynzFw';
const sheetIdTest = '1KZGoeeMbVXvKwRWvSkvb9_3NhYWTse_o0GvytZtiT_U';
const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
const query = encodeURIComponent('Select *');
const url = `${base}&tq=${query}`;

// current data being visualized
var dataIdx = 0;
var mass = [];
var erg_msm = [];
var erg_model = [];
var date_model = [];
var heat = [];
var energy = [];
var fTop = [];
var fBtm = [];

// current data being visualized
var dataIdx = 0;
var mass = [];
var heat = [];
var energy = [];
var fTop = [];
var fBtm = [];

// create password validator
var secret;
createModule().then(({
    Secret
}) => {
    // save ref to object
    secret = new Secret();
});

// validation method
function unlockSecret() {
    var usr = document.getElementById("in_usr").value;
    var psw = document.getElementById("in_psw").value;
    var status = secret.unlock(usr, psw);
    var elem = document.getElementById("out_login");
    if (status) {
        elem.innerHTML = "Bem vindo!";
        document.getElementById("login").style.display = "none";
        document.getElementById("interface").style.display = "block";
        insert_text("console", "Aguardando dados da estação...");
        getData();
    } else {
        elem.innerHTML = "Falha na autenticação!";
    }
}

document.getElementById("btn_login").onclick = unlockSecret;

// load data
insert_text("console", "Aguardando dados da estação...");

fetch(url)
    .then(res => res.text())
    .then(data => {
        insert_text("console", "Dados adquiridos");
        const temp = data.substring(47).slice(0, -2);
        const json = JSON.parse(temp);
        const rows = json.table.rows;
        console.log("rows: ", rows);
        fillColumns(rawData, rows);
        insert_text("console", "Carregados " + rawData[0].length + " registros");
        insert_text("console", "Efetuando conversão de unidades...");
        fixDataUnits(rawData);

        var i = 0;
        while (isNaN(rawData[0][i])) { i++; }
        var dateString = rawData[0][i].toISOString();
        document.getElementById("time-begin1").value = dateString.substring(0, dateString.length - 8);
        document.getElementById("time-begin2").value = dateString.substring(0, dateString.length - 8);

        dateString = rawData[0][rawData[0].length - 1].toISOString();
        document.getElementById("time-end1").value = dateString.substring(0, dateString.length - 8);
        document.getElementById("time-end2").value = dateString.substring(0, dateString.length - 8);
    })
    .then(res => {
        // create raw plot traces
        var raw_plot_traces = [];
        for (var i = 0; i < rawData.length; i++) {
            raw_plot_traces.push({
                name: colNames[i],
                x: rawData[0],
                y: rawData[i],
                type: 'scatter',
                visible: false,
            })
        }
        // populate raw plot
        var raw_plot_layout = {
            title: 'Dados brutos',
            font: { size: 13 },
            showlegend: false,
            colorway: ['#e6194b', '#3cb44b', '#ffe119', '#0082c8', '#f58231',
                '#911eb4', '#46f0f0', '#f032e6', '#d2f53c', '#fabebe',
                '#008080', '#e6beff', '#aa6e28', '#fffac8', '#800000',
                '#aaffc3', '#808000', '#ffd8b1', '#000080', '#808080',
                '#ffffff', '#000000'],
        };
        var raw_plot_config = { responsive: true };
        var rawPlot = document.getElementById('fig-view-raw');
        Plotly.newPlot('fig-view-raw', raw_plot_traces, raw_plot_layout, raw_plot_config);
        // create raw plot toggle
        var rawToggleTable = document.getElementById("toggle-view-raw");
        for (var i = 3; i < rawData.length; i++) {
            var row = rawToggleTable.insertRow();
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var toggleId = 'toggle-raw-' + i;
            cell1.innerHTML = "<label for='" + toggleId + "'>" + colNames[i] + "</label>";
            cell2.innerHTML = "<input type='checkbox' value = " + i + " id='" + toggleId + "'>";
            // enable toggling hability
            document.getElementById(toggleId).onchange = function () {
                //toggle_trace_view(rawPlot, this.value);
                rawPlot.data[this.value].visible = !(rawPlot.data[this.value].visible);
                Plotly.update('fig-view-raw', raw_plot_traces, raw_plot_layout);
            };
        }
    })
    .then(res => {
        insert_text("console", "Criando visualizador instantâneo...");
        // get temperature data
        dataIdx = Math.floor(Math.random() * rawData[0].length);
        refreshTempData(dataIdx);
        // create profile plot
        var profile_traces = [];
        profile_traces.push({
            name: "temperaturas",
            x: tempVal,
            y: tempLoc,
            line: { shape: 'spline' },
            type: 'scatter',
            visible: true,
        });
        // populate raw plot
        var profile_layout = {
            title: 'Perfil de temperatura',
            font: { size: 13 },
            showlegend: false,
            xaxis: {
                title: "Temperatura (°C)",
                range: [20, 35]
            },
            yaxis: {
                title: "Elevação (m)",
            }
        };
        var profile_config = { responsive: true };
        Plotly.newPlot('fig-profile', profile_traces, profile_layout, profile_config);

        // create instant visualizer
        var rawViewTable = document.getElementById("view-meas-value");
        for (var i = 3; i < rawData.length; i++) {
            var row = rawViewTable.insertRow();
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var viewId = 'view-meas-' + i;
            cell1.innerHTML = "<label for='" + viewId + "'>" + colNames[i] + "</label>";
            cell2.innerHTML = "<input type='number' disabled id='" + viewId + "'>";
        }
        // enable navigation bar
        document.getElementById("idx-meas").min = 0;
        document.getElementById("idx-meas").max = rawData[0].length - 1;
        document.getElementById("idx-meas").value = dataIdx;
        document.getElementById("idx-meas").oninput = function () {
            dataIdx = this.value;
            // put in form: "yyyy-MM-ddThh:mm"
            const date = rawData[0][dataIdx];
            var dateString = date.toISOString();
            dateString = dateString.substring(0, dateString.length - 8);
            document.getElementById("time-view").value = dateString;
            // fill data visualizer
            for (var i = 3; i < rawData.length; i++) {
                var viewId = 'view-meas-' + i;
                var val = rawData[i][dataIdx];
                if (!isNaN(val)) {
                    document.getElementById(viewId).value = rawData[i][dataIdx];
                }
            }
            // Update energy balance
            document.getElementById("top-heat-flow").value = fTop[dataIdx];
            document.getElementById("btm-heat-flow").value = fBtm[dataIdx];
            document.getElementById("internal-energy").value = energy[dataIdx];
            document.getElementById("depleted-energy").value = heat[dataIdx];
            document.getElementById("equivalent-mass").value = mass[dataIdx];

            // update temperature profile
            refreshTempData(dataIdx);
            var dateString = rawData[0][dataIdx].toISOString()
            dateString = dateString.substring(0, dateString.length - 8)
            profile_layout.title.text = "Perfil de temperatura<br>" + dateString;
            profile_layout.title.size = 10;
            Plotly.update('fig-profile', profile_traces, profile_layout);
            // update depletion figure pointer
            var nszdPlot = document.getElementById("fig-depletion");
            nszdPlot.data[0].x[0] = rawData[0][dataIdx];
            nszdPlot.data[0].x[1] = rawData[0][dataIdx];
            nszdPlot.data[0].y[0] = 0;
            nszdPlot.data[0].y[1] = nszdPlot.data[1].y[dataIdx];
            Plotly.redraw("fig-depletion");
        }
    })
    .then(res => {
        //document.getElementById("time-begin").value = 
        // loading substances
        insert_text("console", "Carregando substâncias...");
        for (var i = 0; i <= subsNames.length; i++) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.innerHTML = subsNames[i];
            document.getElementById("substance").appendChild(opt);
        }
        // loading soil data to controls
        document.getElementById("substance").value = subsIndex;
        document.getElementById("spec-energy").value = subsEnergy[subsIndex] / 1000;
        document.getElementById("porosity").value = soil.phi;
        document.getElementById("therm-cap").value = soil.cSat / 1e6;
        document.getElementById("therm-cond").value = soil.kSat;
        document.getElementById("vang-coef").value = soil.vg_alpha;
        document.getElementById("vang-exp").value = soil.vg_n;
        // adding functionality to substance
        document.getElementById("substance").onchange = function () {
            if (this.value == 0) {
                document.getElementById("spec-energy").disabled = false;
            } else {
                document.getElementById("spec-energy").disabled = true;
                document.getElementById("spec-energy").value = subsEnergy[this.value] / 1000;
            }
            setSubsIndex(this.value);
        }
        // adding functionality to energy density
        document.getElementById("spec-energy").onchange = function () {
            if (document.getElementById("substance").value == 0) {
                setSubsEnergy(1000 * document.getElementById("spec-energy").value);
            }
        }

        var pointerX = [rawData[0][dataIdx], rawData[0][dataIdx]];
        var pointerY = [0, mass[dataIdx]];
        var nszd_traces = [];
        // cursor
        nszd_traces.push({
            name: "Registro",
            x: pointerX,
            y: pointerY,
        });
        // energy model
        nszd_traces.push({
            name: "erg. emitida (nszd + irrad + fluxo)",
            x: date_model,
            y: erg_model,
            yaxis: 'y2',
            line: { shape: 'spline' },
            type: 'scatter',
            visible: true,
        });
        // energy fill balance
        nszd_traces.push({
            name: "Erg. emitida (nszd + irrad + fluxo + água)",
            x: rawData[0],
            y: erg_msm,
            yaxis: 'y2',
            line: { shape: 'spline' },
            type: 'scatter',
            visible: true,
        });
        // nszd energy trace
        nszd_traces.push({
            name: "Erg. emitida (nszd)",
            x: rawData[0],
            y: heat,
            yaxis: 'y2',
            line: { shape: 'spline' },
            type: 'scatter',
            visible: true,
        });
        // mass trace
        nszd_traces.push({
            name: "Massa degradada",
            x: rawData[0],
            y: mass,
            line: { shape: 'spline' },
            type: 'scatter',
            visible: true,
        });

        // populate raw plot
        var nszd_layout = {
            title: 'Depleção de Massa do contaminante',
            font: { size: 13 },
            showlegend: true,
            legend: {
                x: 0,
                xanchor: 'left',
                y: 1.1
            },
            xaxis: { title: "Tempo" },
            yaxis: { title: "Massa [g/m²]"},
            yaxis2: {
                title: 'Energia [MJ/m²]',
                titlefont: {color: 'rgb(148, 103, 189)'},
                tickfont: {color: 'rgb(148, 103, 189)'},
                overlaying: 'y',
                side: 'right'
              }
        };
        var nszd_config = { responsive: true };
        Plotly.newPlot('fig-depletion', nszd_traces, nszd_layout, nszd_config);
        // enable downlod
        // var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nszd_traces));
        

        insert_text("console", "Calculando a depleção de massa do contaminante...");
        calcDepletion(rawData[0], rawData[2], rawData[13], mass, heat, energy, fBtm, fTop, erg_msm, date_model, erg_model);
        Plotly.update('fig-depletion', nszd_traces, nszd_layout);

        // adding functionality to recalculate
        document.getElementById("recalculate").onclick = function () {
            insert_text("console", "Recalculando a depleção de massa do contaminante...");
            soil.phi = document.getElementById("porosity").value;
            soil.cSat = 1e6 * document.getElementById("therm-cap").value;
            soil.kSat = document.getElementById("therm-cond").value;
            soil.vg_alpha = document.getElementById("vang-coef").value;
            soil.vg_n = document.getElementById("vang-exp").value;

            calcDepletion(rawData[0], rawData[2], rawData[13], mass, heat,
                          energy, fBtm, fTop, date_model, mass_model);
            
            Plotly.update('fig-depletion', nszd_traces, nszd_layout);
        }
    })