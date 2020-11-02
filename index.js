// load libraries
const express = require('express')
const hbs = require('express-handlebars')

// configure mysql2 with promises
const mysql = require('mysql2/promise')

// SQL FIND BY NAME
const SQL_FIND_BY_NAME = 'Select * from apps where name like ? limit ? offset ?'

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

app.engine('hbs', hbs({
  defaultLayout: 'main.hbs'
}))
app.set('view engine', 'hbs')

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.status(200).type('text/html')
  res.render('search')
})

app.get('/search', async (req, res) => {
  console.log('received search query: ', req.query.searchQuery)
  const searchQuery = req.query.searchQuery
  const conn = await pool.getConnection()
  try {
    // perform query
    // use .query(sql , [variables,variable2])
    // returns array of two elements [first, second]
    // first element: array of records
    // sec element: metadata
    if (!req.query.offset) {
  const offset = 0;
} else {

  const offset = parseInt(req.query.offset)
}
    const result = await conn.query(SQL_FIND_BY_NAME, [`%${searchQuery}%`, 10, offset])
    const records = result[0]
    const string = JSON.stringify(records)
    console.log(`convert to string: `, string)
    const jsonObj = JSON.parse(string)
    console.log(`convert back to jsonobj: `, jsonObj)
    const metaData = result[1]
    // console.info(`records: `, records)
    // console.info(`metaData: `, metaData)
    // console.info(`1st record app_id: `, records[0].app_id)
    res.status(200).type('text/html')
    res.render('results', {
      records: records,
      searchQuery: searchQuery
    })

} catch (err) {
  console.log(err)

} finally {
  // release connection
  conn.release()
}

})

startAPP(app, pool)
