require 'rake/clean'

# Documentation tasks taken from http://is.gd/obgMWg

desc "Generate Shred documentation"
task :docs do
  `rm -rf docs/*`
  `node_modules/docco/bin/docco lib/*.js lib/shred/*.js lib/shred/mixins/*.js examples/*.js`
  `cp docs/examples.html docs/index.html`
end
directory "docs/"

desc "Build docs and open in browser for the reading"
task :read => :docs do
  `open docs/index.html`
end

CLEAN << Dir["docs/**/*"]

# Alias for docs task
task :doc => :docs

desc 'Update gh-pages branch'
task :pages => ['docs/.git', :docs] do
  rev = `git rev-parse --short HEAD`.strip
  Dir.chdir 'docs' do
    sh "git add *.html"
    sh "git commit -m 'rebuild pages from #{rev}'" do |ok,res|
      if ok
        verbose { puts "gh-pages updated" }
        sh "git push -q o HEAD:gh-pages"
      end
    end
  end
end

# Update the pages/ directory clone
file 'docs/.git' => ['docs/', '.git/refs/heads/gh-pages'] do |f|
  sh "cd docs && git init -q && git remote add o ../.git" if !File.exist?(f.name)
  sh "cd docs && git fetch -q o && git reset -q --hard o/gh-pages && touch ."
end
CLOBBER.include 'docs/.git'

