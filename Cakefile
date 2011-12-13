# https://github.com/jashkenas/coffee-script/wiki/[HowTo]-Compiling-and-Setting-Up-Build-Tools

fs = require('fs')
path = require('path')
coffee = require('coffee-script')

{exec} = require 'child_process'
    
execute = (cmd) ->
  exec cmd, (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
    
output = 'lib/backbone-suggestions.js'
uglifyOutput = 'lib/backbone-suggestions.min.js'
src = [
    'src/globals.coffee',
    'src/models.coffee',
    'src/controllers.coffee',
    'src/views.coffee',
    'src/exports.coffee'
  ]
generatedFiles = [
    'demo/public/js/backbone-suggestions.js'
    'docs/',
    'lib/',
    'specs/controllers/*.js',
    'specs/models/*.js',
    'specs/views/*.js',
    'specs/*.js'
  ]

task 'build', 'Compile all', ->
  invoke 'uglify'
  invoke 'docs'
  
task 'build-js', 'Compile CoffeeScript to JavaScript', ->
  libs = path.join __dirname, 'src'
  version = fs.readFileSync(path.join __dirname, 'VERSION').toString().trim()
  dir = path.join __dirname, 'lib'
  output = path.join dir, 'backbone-suggestions.js'
  copyright = path.join libs, 'copyright.js'
  csfiles = [
    path.join libs, 'globals.coffee'
    path.join libs, 'models.coffee'
    path.join libs, 'controllers.coffee'
    path.join libs, 'views.coffee'
    path.join libs, 'exports.coffee'
  ]
  
  fs.mkdirSync dir unless path.existsSync dir
  
  fd = fs.openSync output, 'w'
  contents = []
  contents.push fs.readFileSync(csfile).toString() for csfile in csfiles
  
  fs.writeSync fd, "#{fs.readFileSync(copyright).toString().replace('@@VERSION@@', version)}\n"
  fs.writeSync fd, coffee.compile(contents.join('\n').replace('@@VERSION@@', version))
  fs.closeSync fd

task 'docs', 'Generate documentation', ->
  execute 'docco src/*.coffee'
  
task 'uglify', 'Uglify the resulting application file after build', ->
  invoke 'build-js'
  execute "uglifyjs #{output} > #{uglifyOutput}"
  
task 'clean', 'Removes all generated files', ->
  execute "rm -rf #{generatedFiles.join ' '}"
  
task 'spec', 'Compiles all of the spec files', ->
  invoke 'uglify'
  execute 'coffee --compile specs/'
  
task 'demo', 'Launch the demo server', ->
  app = require './demo/app'