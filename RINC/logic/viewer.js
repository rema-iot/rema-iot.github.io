import { post } from "./post.js";
import { SESSION, RINC_API } from "./login.js";
import { overlayOn, overlayOff } from "./main.js";

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
    const keys = Object.keys(data);
    var traces = [];
    for (var key of keys) {
        if (key != "Timestamp")
            traces.push({
                name: key,
                x: data["Timestamp"],
                y: data[key],
                line: { shape: 'line' },
                type: 'scatter',
                visible: true,
            });
    }

    var layout = {
        title: 'Dados brutos',
        font: { size: 13 },
        showlegend: true,
    };

    var config = { responsive: true };

    Plotly.newPlot('raw_plot', traces, layout, config);
    var flux = calcFlux(data);
    plotFlux(flux);
}

function calcFlux(data) {
    var flux = { ftSN: [], ftWE: [], ftBT: [], fbSN: [], fbWE: [], fbBT: [] };
    flux.Timestamp = data["Timestamp"];
    var diam = 0.1;
    var height = 0.05;
    for (var i = 0; i < data["Timestamp"].length; i++) {
        flux.ftSN.push(-(data["TempFtTN"][i] - data["TempFtTS"][i]) / diam);
        flux.ftWE.push(-(data["TempFtBE"][i] - data["TempFtBW"][i]) / diam);
        flux.ftBT.push(-(data["TempFtTN"][i] + data["TempFtTS"][i] -
            data["TempFtBE"][i] - data["TempFtBW"][i]) / (2 * height));
        flux.fbSN.push(-(data["TempFbTN"][i] - data["TempFbTS"][i]) / diam);
        flux.fbWE.push(-(data["TempFbBE"][i] - data["TempFbBW"][i]) / diam);
        flux.fbBT.push(-(data["TempFbTN"][i] + data["TempFbTS"][i] -
            data["TempFbBE"][i] - data["TempFbBW"][i]) / (2 * height));
    }
    console.log("flux: ", flux);
    return flux;
}

function plotFlux(flux) {
    const keys = Object.keys(flux);
    var traces = [];
    for (var key of keys) {
        if (key != "Timestamp")
            traces.push({
                name: key,
                x: flux["Timestamp"],
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
    };

    var config = { responsive: true };

    Plotly.newPlot('flux_plot', traces, layout, config);
}