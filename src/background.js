'use strict'

/*

1. DB 관련 부분
2. 대상 URL 관리 부분
3. 모니터링 부분
4. ipc통신 부분
이야~~~~ 죽이눼

*/

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
//import SQLServer, { select_url_list1 } from './components/SQLServer'
const SQLServer = require('./components/SQLServer')
import { NVarChar } from 'mssql'
import { url } from 'inspector'
const isDevelopment = process.env.NODE_ENV !== 'production'
const { ipcMain } = require('electron');
const NS_PER_SEC = 1e9
const MS_PER_NS = 1e6
var http = require('http');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
var cron = require('node-cron');
//#region init
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true
    }
  })

  //connectToDatabase()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
//#endregion

//#region DB Connection

//#endregion

//#region select query
//url list 출력
function select_url_list(callback) {
	var result = SQLServer.select_url_list1()
	//select_url_list1()
	console.log(JSON.parse(result))
  // query to the database and get the records
//   request.query('SELECT * FROM electron_url_list ORDER BY seq desc', function (err, recordset) {
//     if (err) {
//       return console.error('error query is', err)
//     } else {
//       console.log('Query 완료')
//       // Conver Return Data Object to string
//       var result = JSON.stringify(recordset)
//       callback(result)
//     }
//   })
}

//url 타이밍 출력
function select_url_timing(seq, callback) {
  // query to the database and get the records
  request.query("SELECT top 10 * FROM electron_url_timing where url_code = '" + seq + "' ORDER BY url_round desc", function (err, recordset) {
    if (err) {
      return console.error('error query is', err)
    } else {
      console.log('Query 완료')
      // Conver Return Data Object to string
      var result = JSON.stringify(recordset)
      callback(result)
    }
  })
}

//url code 채번
function select_seqplus(url, start, callback) {
  var seqdate
  var seq
  console.log('sqlplus접속')
  request.query('SELECT TOP 1 SEQ + 1 as seq FROM electron_url_list ORDER BY create_date desc', function (err, recordset) {
    if (err) {
      return console.error('error query is', err)
    } else {
      console.log('Query 완료')
      // Conver Return Data Object to string
      seqdate = JSON.stringify(recordset)
      console.log('info', JSON.parse(seqdate).recordset == '' ? 1 : JSON.parse(seqdate).recordset[0].seq)
      seq = JSON.parse(seqdate).recordset == '' ? 1 : JSON.parse(seqdate).recordset[0].seq

      var options = {
        host: url,
        port: '',
        path: '',
        seq: seq
      };

      console.log('sqlplus', options)
      insert_url_list(url, options, start, function (result) {
        callback(recordset)
      })
    }
  })
}
//#endregion

//#region insert query
/*
url_list 저장
*/
function insert_url_list(url, options, start, callback) {
  var statuscode = 0;
  var dnslookupat;
  var location;
  var loading;
  var total;
  var host;
  var status;

  var req = http.request(options, function (response) {

    const monitoringResult = {
        responseStateuCode: undefined,
        eventTimes: {
          // use process.hrtime() as it's not a subject of clock drift
          startAt: process.hrtime(),
          dnsLookupAt: undefined,
          tcpConnectionAt: undefined,
          tlsHandshakeAt: undefined,
          firstByteAt: undefined,
          endAt: undefined
        }
      }
    // response 이벤트가 감지되면 데이터를 body에 받아온다
    response.on('data', function (data) {

    });
    // end 이벤트가 감지되면 데이터 수신을 종료하고 내용을 출력한다
    response.on('end', function () {
        monitoringResult.eventTimes.endAt = process.hrtime()

        statuscode = response.statusCode

        dnslookupat = monitoringResult.eventTimes.dnsLookupAt !== undefined ?
        getHrTimeDurationInMs(monitoringResult.eventTimes.startAt, monitoringResult.eventTimes.dnsLookupAt) : undefined
        location = response.headers.location
        loading = new Date().getTime() - start
        total = getHrTimeDurationInMs(monitoringResult.eventTimes.startAt, monitoringResult.eventTimes.endAt)
        host = options.host

        console.log('dnslookupat', dnslookupat)
        console.log('location', response.headers.location)
        console.log('loading', new Date().getTime() - start)
        console.log('total', getHrTimeDurationInMs(monitoringResult.eventTimes.startAt, monitoringResult.eventTimes.endAt))
        console.log("host : " + options.host + ", status : " + response.statusCode)
    });
  });

  req.on('socket', (socket) => {
    socket.on('lookup', () => {
        monitoringResult.eventTimes.dnsLookupAt = process.hrtime()
    })
    socket.on('connect', () => {
        monitoringResult.eventTimes.tcpConnectionAt = process.hrtime()
    })
    socket.on('secureConnect', () => {
        monitoringResult.eventTimes.tlsHandshakeAt = process.hrtime()
    })
    socket.on('timeout', () => {
      req.abort()

      const err = new Error('ETIMEDOUT')
      err.code = 'ETIMEDOUT'
      callback(err)
    })
  })
  req.end();

  setTimeout(function () {
    var request = new sql.Request(request);
    var strSql = "";

    console.log('seq', options.seq)
    console.log('url', options.host)
    console.log('statuscode', statuscode)
    strSql = "insert into electron_url_list(seq, user_url, url_status, create_date) ";
    strSql = strSql + " values ('" + options.seq + "','" + options.host + "','" + statuscode + "',getdate())";

    request.query(strSql, function (err, recordset) {
      if (err) {
        console.log('Query fail')
        return console.error('error query is', err)
      }
      else {
        console.log('Query succes')
      }
      //console.log('result query is', recordset);
    });

    strSql = "insert into electron_url_timing "
    strSql = strSql + "(url_code, url_round, url_host, url_status, url_loading, url_dns, url_total, create_date) ";
    strSql = strSql + " values ('" + options.seq + "', 1, '" + options.host + "', '" + statuscode + "', '" + loading + "', '" + dnslookupat + "', '" + total + "',getdate())";

    request.query(strSql, function (err, recordset) {
      if (err) {
        console.log('Query fail')
        return console.error('error query is', err)
      }
      else {
        console.log('Query succes')
        callback(recordset)
      }
      //console.log('result query is', recordset);
    });
  }, 100)
}

/*
url_timing 저장

node.js

EventEmiiter

emit -> 이벤트 발생, emit('test', ...arguments)
on -> 이벤트 수신, on('test', callback)
off -> 이벤트 제거, off('test', callback)
once -> 한번만, once('test, callback)

*/
function insert_url_timing(options, timestart, callback) {
  var statuscode = 0;
  var dnslookupat;
  var location;
  var loading;
  var total;
  var host;
  var status;

  const monitoringResult = {
    responseStateuCode: undefined,
    eventTimes: {
      // use process.hrtime() as it's not a subject of clock drift
      startAt: process.hrtime(),
      dnsLookupAt: undefined,
      tcpConnectionAt: undefined,
      tlsHandshakeAt: undefined,
      firstByteAt: undefined,
      endAt: undefined
    }
  }

  var req = http.request(options, function (response) {
    // response 이벤트가 감지되면 데이터를 body에 받아온다
    response.on('data', function (data) {

    });
    // end 이벤트가 감지되면 데이터 수신을 종료하고 내용을 출력한다
    response.on('end', function () {
        monitoringResult.eventTimes.endAt = process.hrtime()

        statuscode = response.statusCode
        monitoringResult.responseStateuCode = response.statusCode;

        dnslookupat = monitoringResult.eventTimes.dnsLookupAt !== undefined ?
        getHrTimeDurationInMs(monitoringResult.eventTimes.startAt, monitoringResult.eventTimes.dnsLookupAt) : undefined
        location = response.headers.location
        loading = new Date().getTime() - timestart - 100
        total = getHrTimeDurationInMs(monitoringResult.eventTimes.startAt, monitoringResult.eventTimes.endAt)
        host = options.host

        console.log('dnslookupat', dnslookupat)
        console.log('location', response.headers.location)
        console.log('loading', new Date().getTime() - timestart)
        console.log('total', getHrTimeDurationInMs(monitoringResult.eventTimes.startAt, monitoringResult.eventTimes.endAt))
        console.log("host : " + options.host + ", status : " + response.statusCode)
    });
  });

  req.on('socket', (socket) => {
    socket.on('lookup', () => {
        monitoringResult.eventTimes.dnsLookupAt = process.hrtime()
    })
    socket.on('connect', () => {
        monitoringResult.eventTimes.tcpConnectionAt = process.hrtime()
    })
    socket.on('secureConnect', () => {
        monitoringResult.eventTimes.tlsHandshakeAt = process.hrtime()
    })
    socket.on('timeout', () => {
      req.abort()

      const err = new Error('ETIMEDOUT')
      err.code = 'ETIMEDOUT'
      callback(err)
    })
  })
  req.end();

  setTimeout(function () {
    var request = new sql.Request(request);
    var strSql = "";

    strSql = "insert into electron_url_timing";
    strSql = strSql + " (url_code, url_round, url_host, url_status, url_loading, url_dns, url_total, create_date)"
    strSql = strSql + " select"
    strSql = strSql + " top 1 '" + options.seq + "', url_round+1, '" + options.host + "', '" + statuscode + "', '" + loading + "', '" + dnslookupat + "',"
    strSql = strSql + " '" + total + "', GETDATE()"
    strSql = strSql + " from electron_url_timing"
    strSql = strSql + " where url_code = '" + options.seq + "'"
    strSql = strSql + " order by url_round desc";

    request.query(strSql, function (err, recordset) {
      if (err) {
        console.log('Query fail')
        return console.error('error query is', err)
      }
      else {
        console.log('Query succes')
        callback(recordset)
      }
      //console.log('result query is', recordset);
    });

  }, 100)

}
//#endregion

//#region delete query
function delete_url_list(seq, callback) {
  // or: var request = connection.request();
  var request = new sql.Request(request);
  var strSql = "";

  strSql = "DELETE FROM electron_url_list WHERE seq = '" + seq + "' ";

  request.query(strSql, function (err, recordset) {
    if (err) {
      console.log('Query fail')
      return console.error('error query is', err)
    }
    else {
      console.log('Query succes')
      callback(recordset)
    }
    //console.log('result query is', recordset);
  });
}

/*
url리스트 삭제시 해당 url의 타이밍 정보 삭제
*/
function delete_url_timing(seq, callback) {
  // or: var request = connection.request();
  var request = new sql.Request(request);
  var strSql = "";

  strSql = "DELETE FROM electron_url_timing WHERE url_code  = '" + seq + "' ";

  request.query(strSql, function (err, recordset) {
    if (err) {
      console.log('Query fail')
      return console.error('error query is', err)
    }
    else {
      console.log('Query succes')
      callback(recordset)
    }
    //console.log('result query is', recordset);
  });
}
//#endregion

//#region update query
function update_url_list(seq, url, callback) {
  // or: var request = connection.request();
  var request = new sql.Request(request);
  var strSql = "";

  strSql = "UPDATE electron_url_list ";
  strSql = strSql + "SET user_url = '" + url + "' ";
  strSql = strSql + "WHERE seq = '" + seq + "' ";

  request.query(strSql, function (err, recordset) {
    if (err) {
      console.log('Query fail')
      return console.error('error query is', err)
    }
    else {
      console.log('Query succes')
      callback(recordset)
    }
    //console.log('result query is', recordset);
  });
}
//#endregion

//#region ipc select
ipcMain.on("select_url_list", (event, args) => {
  select_url_list(function (result) {
    event.sender.send('succes_select_list', result);
    var ArrResult = []
    var data = JSON.parse(result).recordset
    for (var i = 0; i < data.length; i++) {
      ArrResult[i] = data[i].seq
    }
    ArrResult.forEach((ArrResults) => {
      select_url_timing(ArrResults, function (result) {
        event.sender.send('succes_select_timing', result, ArrResult.length);
      });
    })
  });
}),

  //#endregion

  //#region ipc insert
  /*
  URL_List 저장
  */
  ipcMain.on("insert_url_list", (event, args, url, start) => {
    select_seqplus(url, start, function (result) {
      event.sender.send('succes_insert', 'succes');
    });

    /*
    insert_url_list(url, options, function(result){
        event.sender.send('succes_insert', 'succes');
    });
    */
  }),

  /*
  URL_Timing 저장
  */
  ipcMain.on("insert_url_timing", (event, args, timestart) => {
    var date = '';
    var options = [];
    var forkey = 1;
    select_url_list(function (result) {
      date = JSON.parse(result).recordset
      event.sender.send('succes_select_list', result);
      for (var i = 0; i < date.length; i++) {
        options.push(
          {
            host: date[i].user_url,
            port: '',
            path: '',
            seq: date[i].seq
          }
        )
      }
      options.forEach((option) => {
        insert_url_timing(option, timestart, function (result) {
          forkey++
          if (options.length == forkey) {
            event.sender.send('succes_insert', 'succes');
          }
        });
      })
      
    });

    

  }),
  //#endregion

  //#region ipc delete
  ipcMain.on("delete_url_list", (event, args, seq) => {
    delete_url_list(seq, function (result) {
      delete_url_timing(seq, function (result) {
        event.sender.send('succes_delete', 'succes');
      });
    });
  }),
  //#endregion

  //#region ipc update
  ipcMain.on("update_url_list", (event, args, seq, url) => {
    update_url_list(seq, url, function (result) {
      event.sender.send('succes_update', 'succes');
    });
  })
//#endregion

//#region GetTiming
const eventTimes = {
  // use process.hrtime() as it's not a subject of clock drift
  startAt: process.hrtime(),
  dnsLookupAt: undefined,
  tcpConnectionAt: undefined,
  tlsHandshakeAt: undefined,
  firstByteAt: undefined,
  endAt: undefined
}

function getHrTimeDurationInMs(startTime, endTime) {
  const secondDiff = endTime[0] - startTime[0]
  const nanoSecondDiff = endTime[1] - startTime[1]
  const diffInNanoSecond = secondDiff * NS_PER_SEC + nanoSecondDiff

  return diffInNanoSecond / MS_PER_NS
}
//#endregion