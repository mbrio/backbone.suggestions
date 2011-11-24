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
generatedFiles = [
    'docs/',
    'lib/',
    'specs/controllers/*.js',
    'specs/models/*.js',
    'specs/views/*.js',
    'specs/*.js'
  ]

task 'build', 'Compile CoffeeScript to JavaScript', ->
  execute "coffee --join #{output} --compile #{src.join ' '}"

task 'docs', 'Generate documentation', ->
  execute 'docco src/*.coffee'
  
task 'uglify', 'Uglify the resulting application file after build', ->
  execute "uglifyjs #{output} > #{uglifyOutput}"
  
task 'clean', 'Removes all generated files', ->
  execute "rm -rf #{generatedFiles.join ' '}"
  
task 'spec', 'Compiles all of the spec files', ->
  execute 'coffee --compile specs/'