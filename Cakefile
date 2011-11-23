# https://github.com/jashkenas/coffee-script/wiki/[HowTo]-Compiling-and-Setting-Up-Build-Tools

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
generatedDirs = [
    'docs/',
    'lib/'
  ]

task 'build', 'Compile CoffeeScript to JavaScript', ->
  execute "coffee --join #{output} --compile #{src.join ' '}"

task 'docs', 'Generate documentation', ->
  execute 'docco src/*.coffee'
  
task 'uglify', 'Uglify the resulting application file after build', ->
  execute "uglifyjs #{output} > #{uglifyOutput}"
  
task 'clean', 'Removes all generated files', ->
  execute "rm -rf #{generatedDirs.join ' '}"