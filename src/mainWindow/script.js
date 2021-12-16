document.addEventListener('DOMContentLoaded', () => { //DOMContentLoaded: HTML completamente carregado, sem esperar pelo carregamento de stylesheet, etc.

    const { ipcRenderer } = require("electron");

    //Declarations:
    const display = document.querySelector('#display');
    const record = document.querySelector('#record');
    const micInput = document.querySelector('#mic');

    let isRecording = false;
    let selectedDeviceId = null;
    let mediaRecorder = null;
    let startTime = null;
    let chunks = [];

    //Get available devices:
    navigator.mediaDevices.enumerateDevices().then(devices => {
        devices.forEach(device => {
            if (device.kind === "audioinput") {
                if (!selectedDeviceId) {
                    selectedDeviceId = device.deviceId;
                }
                const option = document.createElement("option");
                option.value = device.deviceId;
                option.text = device.label;

                micInput.appendChild(option);
            }
        })
    }); //retorna uma promise com todos os devices disponiveis.

    micInput.addEventListener("change", (event) => {
        selectedDeviceId = event.target.value; //value é o deviceId, propriedade do elemento device.
        console.log(selectedDeviceId);
    });

    function updateButtonTo(recording) {
        if (recording) {
            document.querySelector('#record').classList.add('recording');
            document.querySelector('#mic-icon').classList.add('hide');
        }
        else {
            document.querySelector('#record').classList.remove('recording');
            document.querySelector('#mic-icon').classList.remove('hide');

        }
    };

    record.addEventListener("click", () => {
        updateButtonTo(!isRecording);
        handleRecord(isRecording);

        isRecording = !isRecording;
    });

    function handleRecord(recording) {
        if (recording) { //handleRecord recebe no evento de click um boolean true
            //stop
            mediaRecorder.stop();
        }
        else {
            //start
            navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedDeviceId }, video: false }).then(stream => { //stream são os dados captados através do device em uso, atualizado de tempos em tempos
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start(); //captação de dados pelo microfone tem início
                startTime = Date.now(); //Quando inicia a gravação, startTime recebe a hora de início (servirá como referência para calculo do tempo decorrido de gravação);
                updateDisplay();
                mediaRecorder.ondataavailable = (event) => {
                    chunks.push(event.data); //dados salvos no array chunks
                };
                mediaRecorder.onstop = () => {
                    //Quando terminar a gravação:
                    saveData();
                };
            });
        };
    };

    function saveData() {
        const blob = new Blob(chunks, { "type": "audio/webm; codecs=opus" }); //tipo de audio e codec para tratar o áudio.
        console.log(blob); //Um objeto Blob representa um objeto do tipo arquivo, com  dados brutos imutáveis.
        // document.querySelector("#audio").src = URL.createObjectURL(blob); //cria uma url virtual para servir de fonte para o audio

        blob.arrayBuffer().then(blobBuffer => {
            const buffer = Buffer.from(blobBuffer, "binary");
            ipcRenderer.send("save_buffer", buffer); //passando um blob como um raw buffer
        })

        chunks = [];
    };

    function updateDisplay() {
        //Pegar a data atual, diminuir da data de início para obter o tempo corrido:
        display.innerHTML = durationToTimestamp(Date.now() - startTime);
        if (isRecording) {
            window.requestAnimationFrame(updateDisplay); //Fala para o navegador que deseja-se realizar uma animação e pede que o navegador chame uma função específica para atualizar um quadro de animação antes da próxima repintura.
        };
    };

    function durationToTimestamp(duration) { //duration é por padrão em milissegundos
        let mili = parseInt((duration % 1000) / 100);
        let seconds = Math.floor((duration / 1000) % 60); //após transformar o número para segundos, pega apenas a sua parte inteira (resto da divisão por 60).
        let minutes = Math.floor(((duration / 1000) / 60) % 60);
        let hours = Math.floor((((duration / 1000) / 60) / 60) % 60);

        seconds = seconds < 10 ? "0" + seconds : seconds;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        hours = hours < 10 ? "0" + hours : hours;

        return `${hours}:${minutes}:${seconds}.${mili}`;
    };
});

//Evitando o efeito de transição quando a página inicial é carregada.
window.onload = () => { //onLoad: além do HTML, recursos externos, como CSS e imagens, também estarão carregados para disparar esse evento.
    document.body.classList.remove('preload');
};