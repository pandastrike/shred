{resource, method, events} = require "../src/shred"
github = resource "https://api.github.com/"

events github
.on "error", (error) -> console.log error

issues = resource github, "repos/pandastrike/shred/issues"
issues.list = method issues,
  method: "get"
  headers:
    accept: "application/vnd.github.v3.raw+json"
  expect: 200

issues.list()
.on "ready", (issues) ->
  console.log "issues:"
  for issue in issues
    console.log issue.id, issue.title
