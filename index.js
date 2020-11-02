// load libraries
const express = require('express')
const hbs = require('express-handlebars')

// configure mysql2 with promises
const mysql = require('mysql2/promise')

// SQL FIND BY NAME
const SQL_FIND_BY_NAME = 'Select * from apps where name like ? limit ? offset ?'
const SQL_COUNT = 'SELECT count(*) as recordNumber FROM apps where name like ?'

// configure PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// configure db pool connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'playstore',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  timezone: '+08:00',
  connectionLimit: 10,
})

// function to check if sql server is connected
const startAPP = async (app, pool) => {
  try {
    // acquire a connection from the connection pool
    const conn = await pool.getConnection()

    console.info('pinging database...')

    await conn.ping()

    // release connection
    conn.release()


    app.listen(PORT, () => {
      console.log(`DB connected and App listening on ${PORT}`)
    })

  } catch (err) {
    console.error('error found:', err)
  }
}

// create instance of app
const app = express()

// set view engine
app.engine('hbs', hbs({
  defaultLayout: 'main.hbs'
}))
app.set('view engine', 'hbs')

// load static resources
app.use(express.static('public'))


// configure app
app.get('/', (req, res) => {
  res.status(200).type('text/html')
  res.render('search')
})

app.get('/search', async (req, res) => {
  console.log('received search query: ', req.query.searchQuery)
  let numberPerPage = parseInt(req.query.numberPerPage)
  const searchQuery = req.query.searchQuery
  let offSet = parseInt(req.query.offSet)

  console.log(`this is offSet:`, numberPerPage)
  console.log(`this is offSet:`, offSet)


  const conn = await pool.getConnection()
  try {
    // perform query
    // use .query(sql , [variables,variable2])

    const result = await conn.query(SQL_FIND_BY_NAME, [`%${searchQuery}%`, numberPerPage, offSet])
    // returns array of two elements [first, second]
    // first element: array of records
    // sec element: metadata
    const records = result[0]

    // testing purpose
    // const string = JSON.stringify(records)
    // console.log(`convert to string: `, string)
    // const jsonObj = JSON.parse(string)
    // console.log(`convert back to jsonobj: `, jsonObj)

    // const metaData = result[1]
    // console.info(`records: `, records)
    // console.info(`metaData: `, metaData)
    // console.info(`1st record app_id: `, records[0].app_id)

    // condition to show buttons
    let showButtonNext = true
    let showButtonBack = true
    // set value of buttons
    let offSetBack, offSetNext

    // check if records return is lesser than number per page
    if (records.length < numberPerPage) {

      // meaning no more records to show
      // next button is hidden
      showButtonNext = false
      // back button value set to previous offset
      offSetBack = offSet - numberPerPage

    } else {
      // set back and next offset
      offSetBack = offSet - numberPerPage
      offSetNext = offSet + numberPerPage
      // for first page results, no back button
      if (offSetBack < 0) {
        showButtonBack = false
      }
      // console.log(`offSetBack`, offSetBack)
    }
    res.status(200).type('text/html')
    res.render('results', {
      records: records,
      searchQuery: searchQuery,
      offSetNext: offSetNext,
      offSetBack: offSetBack,
      showButtonNext: showButtonNext,
      showButtonBack: showButtonBack,
      numberPerPage: numberPerPage
    })

  } catch (err) {
    console.log(err)

  } finally {
    // release connection
    conn.release()
  }

})

// check if server is connected and run the app
startAPP(app, pool)
