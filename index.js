const express = require('express')

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 30090f10

const app = express()


app.listen(PORT,()=>{
  console.log(`app listening to ${PORT}`,PORT)
})
