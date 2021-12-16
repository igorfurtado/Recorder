const { app, BrowserWindow, ipcMain, Menu, globalShortcut, shell, dialog } = require('electron'); //ipcMain usado para receber informação do front para o back e ipcRenderer receber informação do back para o front.
const os = require('os');
const path = require('path');
const fs = require("fs"); //fileServer
const Store = require('./Store');

const preferences = new Store({
    configName: 'user-preferences',
    defaults: {
        destination: path.join(os.homedir(), 'audios')
    }
});

let destination = preferences.get('destination'); //endereço de gravação dos arquivos.

//Checando se está no ambiente de desenvolvimento ou não
const isDev = (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development") ? true : false;

//Checando se o computador de acesso roda MacOS para reproduzir seu comportamento de fechar página e permanecer no dock.
const isMac = process.platform === 'darwin' ? true : false;

//Janela de preferências
function createPreferenceWindow() {
    const preferenceWindow = new BrowserWindow({
        width: isDev ? 950 : 500,
        resizable: isDev ? true : false,
        height: 150,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets/icons/icon.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    preferenceWindow.loadFile('./src/preferences/index.html');

    preferenceWindow.once('ready-to-show', () => {
        preferenceWindow.show();
        if (isDev) {
            //Abrindo o devTools automaticamente quando iniciar uma nova window
            preferenceWindow.webContents.openDevTools();
        };
        preferenceWindow.webContents.send("dest-path-update", destination); //WebContents é o acesso ao que está dentro da janela. Send está mandando para o front end uma informação.
    });
};

//Janela de gravação (home)
function createWindow() {
    const win = new BrowserWindow({ //BrowserWindow cria uma janela.
        width: isDev ? 950 : 500,
        resizable: isDev ? true : false, //permitir mudar o tamanho da tela apenas no ambiente de desenvolvimento.
        height: 300,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets/icons/icon.png"), //em ambiente de desenvolvimento, o app roda baseado em uma instância do electron.
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false //permite que os módulos do node sejam utilizados direto no front-end.
        }//informando ao front-end que o node será utilizado dentro do script, para que o require seja executado.
    });

    win.loadFile('./src/mainWindow/index.html'); //Carregando conteúdo na window via html.

    if (isDev) {
        //Abrindo o devTools automaticamente quando iniciar uma nova window
        win.webContents.openDevTools();
    };

    win.once('ready-to-show', () => { //once, diferente de on, executa apenas uma vez.
        win.show(); //só vai mostrar o conteúdo html quando a página estiver pronta, fazendo com que renderize ao mesmo tempo que a tela.
        //win.webContents.send('cpu_name', os.cpus()[0].model) //WebContents é o acesso ao que está dentro da janela. Send est´mandando para o front end uma informação.
    });

    const menuTemplate = [
        {
            label: app.name,
            submenu: [
                {
                    label: "Preferences",
                    click: () => { createPreferenceWindow() }
                },
                {
                    label: "Open destination folder",
                    click: () => { shell.openPath(destination) } //módulo shell contém funções relacionadas à integração com desktop. Open the given file in the desktop's default manner.
                }
            ]
        },
        {
            label: 'File',
            submenu: [
                isMac ? { role: "close" } : { role: "quit" }
            ]
        }
    ];

    //Criando um menu a partir desse template (necessário importar a classe Menu) do electron:
    const menu = Menu.buildFromTemplate(menuTemplate);
    //Setando o menu da aplicação:
    Menu.setApplicationMenu(menu);
};


//App permite gerenciar vários estados da aplicação:
//whenReady (quando a aplicação estiver pronta): gera uma promise com uma ação a ser executada.
app.whenReady().then(() => {
    console.log("App Ready!")
    createWindow();
    globalShortcut.register('CmdOrCtrl+d', () => { //atalho global funciona inclusive quando outra aplicação estiver aberta e em foco (por isso a importância de antes de fechar a aplicação tirar o registro dessa variável global)
        console.log("atalho global executado");
        BrowserWindow.getAllWindows()[0].setAlwaysOnTop(true); //traz a primeira janela aberta para foco, mesmo quando outra app estiver em foco anteriormente.
        BrowserWindow.getAllWindows()[0].setAlwaysOnTop(false);  //permite que a aplicação saia do topo para voltar a mexer na app anterior.
    })
});

//Quando cria-se um atalho global, é preciso anular o registro desse ao fechar as janelas, para que pare de funcionar após o fechamento do programa.
app.on('will-quit', () => { //will-quit executa logo antes de fechar.
    globalShortcut.unregisterAll();
})

//Chegando alguns estados da aplicação com app.on e criando um listener para esse evento.
app.on('window-all-closed', () => { //ao executar esse estado de observação, o processo de padrão de quitar é interrompido e no mac o app continua disponível no dock.
    console.log("Todas as janelas estão fechadas.")
    if (!isMac) {
        app.quit() //em todos os outros sistemas a aplicação será encerrada ao apertar para fechar, exceto no mac.
    }
});

//Fazendo com que o aplicativo seja reativado após ser clicado no doc do mac (após seu fechamento).
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) { //getAllWindows pega todas as janelas e retorna um array com todas as janelas existentes.
        //Se o Array estiver vazio, aí sim cria uma nova janela (para evitar o bug de criar mais de uma janela quando apertar no ícone electron quando já existir janelas abertas).
        createWindow();
    }
});

ipcMain.on("open_new_window", () => {
    createWindow();
});

ipcMain.on("save_buffer", (e, buffer) => {
    const filePath = path.join(destination, `${Date.now()}`); //o nome do arquivo será um número (data)
    fs.writeFileSync(`${filePath}.webm`, buffer); //creates a new file if the specified file does not exist(arquivo de escrita+formato, o que será colocado no arquivo de escrita).
});

ipcMain.handle('show-dialog', async (event) => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] }); //abrir caixa de seleção de um novo diretório
    const dirPath = result.filePaths[0];

    preferences.set("destination", dirPath);

    destination = preferences.get("destination"); //necessário importação do módulo dialog. Passa o tipo de diálogo que deseja-se que seja aberto.
    return destination; //retorna o destination para o front-end atualizado, após nova seleção 
}); //como foi enviado com invoke ao invés de send, não se usa on, usa-se handle.
