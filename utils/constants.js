const downloadDirectory = `${
  process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']
}/template`

module.exports = {
  downloadDirectory,
}
