import { post } from "./post.js";
import { SESSION, RINC_API } from "./login.js";
import { overlayOn, overlayOff } from "./main.js";
import { signalClean } from "./signal.js";

export function onLoadScript() {
    requestStationList();
}

function requestStationList() {
    var data = {
        rqst: "stationList",
        sessionId: SESSION.sessionId,
        sessionCk: SESSION.sessionCk,
    };
    overlayOn("Carregando lista de estações...");
    post(RINC_API, data, stationListCbk);
}

function stationListCbk(resp) {
    overlayOff();
    if (resp.status == 'OK') {
        for (var elem of resp.stations) {
            var elem_id = 'station_' + elem.id;
            $("#content").append(`<div class = 'card' id = ${elem_id}></div>`);
            $("#" + elem_id).append(`<table>`);
            $("#" + elem_id).append(`<tr> <td><h3>${elem.name}</h3></td> <td style="text-align: right"><button id="btn_${elem_id}" data-idx=${elem.id}> <img src="img/antenna.png" width=30pt/> </button></td> </tr>`);
            $("#" + elem_id).append(`<tr> <td>Sondas de fluxo: </td> <td style="text-align: right">${elem.fluxCount}</td> </tr>`);
            $("#" + elem_id).append(`<tr> <td>Sondas de humidade: </td> <td style="text-align: right">${elem.humCount}</td> </tr>`);
            $("#" + elem_id).append(`<tr> <td>Sondas de nível d'água: </td> <td style="text-align: right">${elem.wlCount}</td> </tr>`);
            $("#" + elem_id).append(`<tr> <td>Latitude: </td> <td style="text-align: right">${elem.coordLat}</td> </tr>`);
            $("#" + elem_id).append(`<tr> <td>Longitude: </td> <td style="text-align: right">${elem.coordLong}</td> </tr>`);
            $("#" + elem_id).append(`<tr> <td>Frequência de postagem: </td> <td style="text-align: right">${elem.sleepTime}s</td> </tr>`);
            const date = new Date(1000 * elem.creationTime);
            const dateString = date.toLocaleString('pt-BR');
            $("#" + elem_id).append(`<tr> <td>Criação: </td> <td style="text-align: right">${dateString}</td> </tr>`);
            $("#" + elem_id).append(`</table>`);
        }
        // add button linsteners
        for (var elem of resp.stations) {
            var btn_id = 'btn_station_' + elem.id;
            $("#" + btn_id).on("click", function (event) {
                const stationId = event.currentTarget.getAttribute("data-idx");
                var data = {
                    rqst: "measurements",
                    sessionId: SESSION.sessionId,
                    sessionCk: SESSION.sessionCk,
                    stationId: stationId
                };
                // erase password before sending form
                overlayOn(`Carregando medições da ${elem.name}...`);
                console.log("posting: ", data);
                post(RINC_API, data, measurementsCbk);
            });
        }
    } else {
        console.log(resp);
    }
}

function measurementsCbk(resp) {
    overlayOff();
    if (resp.status == "OK") {
        console.log("loading dashboard");
        loadViewerDashboard(resp.data);
    } else if (resp.status == "FAILED") {
        alert("Estação indisponível")
        console.log(resp.msg);
    } else {
        console.log("undefined behavior");
    }
}

function loadViewerDashboard(data) {
    $("#dashboard").css('display', 'block');
    removeBadTimestamps(data);
    cleanData(data);
    const keys = Object.keys(data);
    var traces = [];
    for (var key of keys) {
        if (key != "Timestamp" && key != "Date")
            traces.push({
                name: key,
                x: data["Date"],
                y: data[key],
                line: { shape: 'line' },
                type: 'scatter',
                visible: true,
            });
    }

    var layout = {
        title: 'Variáveis da estação',
        font: { size: 13 },
        showlegend: true,
        xaxis: { title: { text: "Tempo" } }
    };

    var config = { responsive: true };

    Plotly.newPlot('raw_plot', traces, layout, config);
    var flux = calcFlux(data);
    plotFlux(flux);
    var erg = calcEnergy(flux);
    plotEnergy(erg);
}

function removeBadTimestamps(data) {
    const keys = Object.keys(data);
    var idx = 0;
    while (idx < data.Timestamp.length) {
        if (Number.isNaN(data.Timestamp[idx]) || data.Timestamp[idx] == '#NUM!') {
            for (var key of keys) {
                data[key].splice(idx, 1);
            }
        } else {
            idx++;
        }
    }
}

function cleanData(data) {
    const winLen = 20; // moving window size
    const keys = Object.keys(data);
    for (var key of keys) {
        signalClean(data[key], winLen);
    }
    data.Date = [];
    for (var stmp of data.Timestamp) {
        var time = new Date(stmp * 1000);
        data.Date.push(time);
    }
}

function calcFlux(data) {
    var flux = { ftSN: [], ftWE: [], ftBT: [], fbSN: [], fbWE: [], fbBT: [] };
    flux.Timestamp = data.Timestamp;
    flux.Date = data.Date;
    var diam = 0.1;
    var height = 0.05;
    var k = 1.5; // thermal conductivity W/m K
    for (var i = 0; i < data["Timestamp"].length; i++) {
        flux.ftSN.push(-k * (data["TempFtTN"][i] - data["TempFtTS"][i]) / diam);
        flux.ftWE.push(-k * (data["TempFtBE"][i] - data["TempFtBW"][i]) / diam);
        flux.ftBT.push(-k * ((data["TempFtTN"][i] + data["TempFtTS"][i] -
            data["TempFtBE"][i] - data["TempFtBW"][i]) / (2 * height)));
        flux.fbSN.push(-k * ((data["TempFbTN"][i] - data["TempFbTS"][i]) / diam));
        flux.fbWE.push(-k * ((data["TempFbBE"][i] - data["TempFbBW"][i]) / diam));
        flux.fbBT.push(-k * ((data["TempFbTN"][i] + data["TempFbTS"][i] -
            data["TempFbBE"][i] - data["TempFbBW"][i]) / (2 * height)));
    }
    return flux;
}

function plotFlux(flux) {
    const keys = Object.keys(flux);
    var traces = [];
    for (var key of keys) {
        if (key != "Timestamp" && key != "Date")
            traces.push({
                name: key,
                x: flux["Date"],
                y: flux[key],
                line: { shape: 'line' },
                type: 'scatter',
                visible: true,
            });
    }

    var layout = {
        title: 'Fluxos de calor',
        font: { size: 13 },
        showlegend: true,
        xaxis: { title: { text: "Tempo" } },
        yaxis: { title: { text: "Fluxo de calor (W/m²)" } }
    };

    var config = { responsive: true };

    Plotly.newPlot('flux_plot', traces, layout, config);
}

function calcEnergy(flux) {
    var erg = { Timestamp: [flux.Timestamp[0]], Date: [flux.Date[0]], EtSN: [0], EtWE: [0], EtBT: [0], EbSN: [0], EbWE: [0], EbBT: [0] };
    var dE, tAvg, dt;
    for (var i = 1; i < flux["Timestamp"].length; i++) {
        tAvg = 0.5 * (flux.Timestamp[i] + flux.Timestamp[i - 1]);
        var time = new Date(tAvg * 1000);
        dt = flux.Timestamp[i] - flux.Timestamp[i - 1];

        if (checkNumbers([tAvg, dt])) {
            erg.Timestamp.push(tAvg);
            erg.Date.push(time);

            dE = 0.5 * (flux.ftSN[i] + flux.ftSN[i - 1]) * dt;
            if (!Number.isNaN(dE)) { erg.EtSN.push(erg.EtSN[i - 1] + dE) }
            else { erg.EtSN.push(erg.EtSN[i - 1]) }

            dE = 0.5 * (flux.ftWE[i] + flux.ftWE[i - 1]) * dt;
            if (!Number.isNaN(dE)) { erg.EtWE.push(erg.EtWE[i - 1] + dE) }
            else { erg.EtWE.push(erg.EtWE[i - 1]) }

            dE = 0.5 * (flux.ftBT[i] + flux.ftBT[i - 1]) * dt;
            if (!Number.isNaN(dE)) { erg.EtBT.push(erg.EtBT[i - 1] + dE) }
            else { erg.EtBT.push(erg.EtBT[i - 1]) }

            dE = 0.5 * (flux.fbSN[i] + flux.fbSN[i - 1]) * dt;
            if (!Number.isNaN(dE)) { erg.EbSN.push(erg.EbSN[i - 1] + dE) }
            else { erg.EbSN.push(erg.EbSN[i - 1]) }

            dE = 0.5 * (flux.fbWE[i] + flux.fbWE[i - 1]) * dt;
            if (!Number.isNaN(dE)) { erg.EbWE.push(erg.EbWE[i - 1] + dE) }
            else { erg.EbWE.push(erg.EbWE[i - 1]) }

            dE = 0.5 * (flux.fbBT[i] + flux.fbBT[i - 1]) * dt;
            if (!Number.isNaN(dE)) { erg.EbBT.push(erg.EbBT[i - 1] + dE) }
            else { erg.EbBT.push(erg.EbBT[i - 1]) }
        }
    }
    return erg;
}

function checkNumbers(vals) {
    var valid = true;
    for (var val of vals) {
        valid = valid && !Number.isNaN(val)
    }
    return valid;
}



function plotEnergy(erg) {
    const keys = Object.keys(erg);
    var traces = [];
    for (var key of keys) {
        if (key != "Timestamp" && key != "Date")
            traces.push({
                name: key,
                x: erg["Date"],
                y: erg[key],
                line: { shape: 'line' },
                type: 'scatter',
                visible: true,
            });
    }
    var layout = {
        title: 'Calor Liberado',
        font: { size: 13 },
        showlegend: true,
        xaxis: { title: { text: "Tempo" } },
        yaxis: { title: { text: "Calor (J/m²)" } }
    };
    var config = { responsive: true };

    Plotly.newPlot('erg_plot', traces, layout, config);
}