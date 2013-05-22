require "starter/tasks/npm"
require "starter/tasks/git"

require "pp"


coffee_files = FileList["src/**/*.coffee"]
#js_files = coffee_files.map do |source|
  #dest = source.chomp("coffee").sub(/^src\//, "lib/") << "js"
  #dest_dir = File.dirname(dest)
  #directory(dest_dir)
  #file dest => [dest_dir, source] do |t|
    #sh "coffee -cp #{source} > #{dest}"
  #end
  #dest
#end

task "test" => "build" do
  sh "cake test"
end

task "build" do
  sh "coffee -c #{coffee_files}"
  FileList["src/**/*.js"].each do |file|
    dest = file.sub(/^src\//, "lib/")
    mkdir_p File.dirname(dest)
    mv file, dest
  end
end


task "manifest" do
  sh "ark manifest --source . | egrep -v 'docco|rephraser|optimist|microtime' > test/browser/manifest.json"
end

task "bundle:test" do
  Dir.chdir "test/browser" do
    sh "ark package < manifest.json > bundle.js"
  end
end


