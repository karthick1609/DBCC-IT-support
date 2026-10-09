require('dotenv').config()

const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const apiRoot = path.resolve(__dirname, '..', 'api')
const publicRoot = path.resolve(__dirname, '..', 'public')

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.all('/api/*', async (req, res) => {
  const segments = req.path.slice('/api/'.length).split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || /[\\\0]/.test(segment))) {
    return res.status(400).json({ success: false, message: 'Invalid API path.' })
  }

  let handlerPath
  let routeParams = {}
  for (let length = segments.length; length > 0; length -= 1) {
    const routePath = path.resolve(apiRoot, ...segments.slice(0, length))
    const directFile = `${routePath}.js`
    const indexFile = path.join(routePath, 'index.js')
    if (directFile.startsWith(`${apiRoot}${path.sep}`) && fs.existsSync(directFile)) {
      handlerPath = directFile
      break
    }
    if (indexFile.startsWith(`${apiRoot}${path.sep}`) && fs.existsSync(indexFile)) {
      handlerPath = indexFile
      break
    }
  }

  if (!handlerPath && segments.length > 1) {
    const dynamicFile = path.resolve(apiRoot, ...segments.slice(0, -1), '[id].js')
    if (dynamicFile.startsWith(`${apiRoot}${path.sep}`) && fs.existsSync(dynamicFile)) {
      handlerPath = dynamicFile
      routeParams.id = segments[segments.length - 1]
    }
  }

  if (!handlerPath) {
    return res.status(404).json({ success: false, message: 'API route not found.' })
  }

  Object.assign(req.query, routeParams)
  try {
    await require(handlerPath)(req, res)
  } catch (error) {
    console.error(`Local API handler failed (${req.method} ${req.path}):`, error)
    if (!res.headersSent) res.status(500).json({ success: false, message: 'The API request failed.' })
  }
})

app.use(express.static(publicRoot, {
  setHeaders(res, filePath) {
    if (path.extname(filePath) === '.html') res.setHeader('Cache-Control', 'no-cache')
  }
}))

app.use((req, res) => {
  res.status(404).type('text/plain').send('Not found')
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`DBASC IT Support is available at http://localhost:${port}`)
})
