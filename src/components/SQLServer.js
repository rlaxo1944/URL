var sql
var request
function connectToDatabase() {
	console.log('접속!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  sql = require('mssql')
  // Database Configuration
  var config = {
    user: 'sa',
    password: 'korea8305',
    server: '192.168.0.79',
    database: 'electron',
    options: {
      encrypt: false
    }
  }

  // connect to your database
  sql.connect(config, function (err) {
    if (err) console.log(err)
    // create Request object
    console.log('DB접속 완료')
    request = new sql.Request()
  })
}

export async function select_url_list1(callback) {
	// query to the database and get the records
	request.query('SELECT * FROM electron_url_list ORDER BY seq desc', function (err, recordset) {
	  if (err) {
		return console.error('error query is', err)
	  } else {
		console.log('Query 완료')
		// Conver Return Data Object to string
		var result = JSON.stringify(recordset)
		return result
		//callback(result)
	  }
	})
  }

connectToDatabase()