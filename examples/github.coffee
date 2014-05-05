{resource} = require "../src/resource.coffee"

github = resource "https://api.github.com/"
github.events.on "error", (error) -> console.log error

shred = github "/repos/pandastrike/shred/"

issues = shred "issues"

issues.get.describe
  headers:
    accept: "application/vnd.github.v3.raw+json"
  expect: 200

# The 'success' event will give you the raw response,
# whereas 'ready' gives you the (possibly parsed) response
# body
issues.get().on "ready", (issues) ->
  console.log issues
