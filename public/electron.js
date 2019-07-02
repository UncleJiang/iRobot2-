const { ipcMain, app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const fs = require('fs');
const iconv = require('iconv-lite');
const exec = require('child_process').exec;

let mainWindow;

require("update-electron-app")({
  repo: "kitze/react-electron-example",
  updateInterval: "1 hour"
});


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 350,
    height: 580,
    frame: false,
    resizable: false,
  });
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.on("closed", () => (mainWindow = null));
}


app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('startMicro', () => {
  exec('d: && java -jar Recognizer.jar', (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
});

ipcMain.on('stopMicro', (event) => {
  exec('taskkill /f /im java.exe', (err) => {
    if (err) {
      console.log(err);
      return;
    }
    let result = fs.readFileSync('D:/my.log');
    result = iconv.decode(result, 'GB2312');
    event.sender.send('getRecognizer', result);
  });
});

ipcMain.on('startSpeaking', (event, data) => {
  exec(`d: && java -jar AIVoice.jar "${data}"`, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
});



//调用python进程
let pyProc = null
let pyPort = null
//let script = path.join(__dirname, 'py', '163.py')
let rootp = path.join(__dirname,'..');
let script = path.join(rootp,'pydist', '163','163')
const createPyProc = () => {
  let port = '4242'
  //let script = path.join(__dirname, 'py', '163.py')
  //pyProc = require('child_process').spawn('python', [script, port])
  pyProc = require('child_process').execFile(script,[port]);
  if (pyProc != null) {
    console.log('child process success')
  }

}

const exitPyProc = () => {
  pyProc.kill()
  pyProc = null
  pyPort = null
}


app.on('ready', createPyProc)
app.on('will-quit', exitPyProc)


ipcMain.on('163python', (event, data) => {

  exec( script+' ' + data+' ',function(error,stdout,stderr){
    if(stdout.length >1){
        console.log('you offer args:',stdout);
        console.log(script);
        //callback(stdout);
      event.returnValue = stdout;
    } else {
        console.log('you don\'t offer args');
        console.log(script);
    }
    if(error) {
        console.info('stderr : '+stderr);
    }

    });

});

