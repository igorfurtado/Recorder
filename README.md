
![Logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/th5xamgrr6se0x5ro4g6.png)


# Recorder

Gravador de voz desenvolvido com Electron durante o curso do ProgramadorBR. Por meio desta aplicação, é possível listar as entradas de áudio disponíveis no computador local e utilizá-las na recepção de áudio.

No *front-end*, foram desenvolvidas duas páginas: uma para visualização da interface de captura de áudio atual, com um timer e botões de ação; outra página mostra um menu de preferências, que fornece configuração do local de salvamento do arquivo gerado (em formato .webm).

No *back-end*, foram criados dois ambientes de trabalho: desenvolvimento e produção. Esses configuram o tamanho das janelas do front e o aparecimento automático do Chrome DevTools (suportado pelo Electron). No back-end foram configuradas funções de criação de novas janelas, opções de menu da aplicação, caminhos para salvamento, etc.

Para permitir a troca de informações entre o front e o back, os módulos ipcMain e ipcRenderer foram utilizados. Além disso, nodeIntegration foi declarado como "true" na criação de uma nova janela (createPreferenceWindow()), fornecendo acesso aos módulos node diretamente no front-end.
## Dependências

Para realização do build da aplicação, o módulo electron-builder foi instalado. Dependendo do sistema operacional que estiver em uso, ele cria um instalador para o gravador.
```bash
  npm install --save-dev electron-builder
```
    
## Screenshots

![App Screenshot](https://via.placeholder.com/468x300?text=App+Screenshot+Here)


## Tech Stack

**Client:** HTML, CSS, JS

**Server:** Electron
