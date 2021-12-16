const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

//Preparando a classe
class Store {
    //Definindo o construtor:
    constructor(options) {
        const userDataPath = app.getPath("userData"); //endereço onde serão gravados dados do usuário. UserData não apaga as informações do app quando o aplicativo é apagado.
        this.path = path.join(userDataPath, options.configName + '.json');
        this.data = parseDataFile(this.path, options.defaults);
    };

    get(key) {
        return this.data[key];
    };

    set(key, value) {
        this.data[key] = value;
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    };
};

function parseDataFile(filePath, defaults) {
    try {
        return JSON.parse(fs.readFileSync(filePath)); //abrir o arquivo passado, ler ele, transformá-lo em um JSON e retorná-lo de fato.
    }
    catch {
        return defaults;
    };
};

module.exports = Store;