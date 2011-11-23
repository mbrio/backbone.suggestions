# https://github.com/jashkenas/coffee-script/wiki/[HowTo]-Compiling-and-Setting-Up-Build-Tools

{exec} = require 'child_process'
execute = (cmd) ->
  exec cmd, (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr

task 'build', 'Compile CoffeeScript to JavaScript', ->
  execute 'coffee --join lib/backbone-suggestions.js --compile src/globals.coffee src/models.coffee src/controllers.coffee src/views.coffee src/views.coffee'

task 'docs', 'Generate documentation', ->
  execute 'docco src/*.coffee'