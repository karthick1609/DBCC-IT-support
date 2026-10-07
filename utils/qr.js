const QRCode = require('qrcode')
const { v4: uuidv4 } = require('uuid')

async function generateAssetQrData(assetId, baseUrl) {
  const url = `${baseUrl}/asset.html?id=${encodeURIComponent(assetId)}`
  const svg = await QRCode.toDataURL(url, { type: 'image/png' })
  return { id: uuidv4(), assetId, url, svg }
}

module.exports = { generateAssetQrData }
