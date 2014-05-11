{resolve} = require "path"
{resource} = require "../../src/shred"
{base64, read} = require "fairmont"
github = resource "https://api.github.com/"

token = read(resolve(__dirname, ".token")).trim()

github.events
.on "error", (error) -> console.log error

issues = github.path "repos/{owner}/{repo}/issues"
.describe
  list:
    method: "get"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 200
  create:
    method: "post"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 201

# create a new ticket...
# issues.
# .expand
#   owner: "pandastrike"
#   repo: "shred-ng"
# create
# .authorize
#   basic: username: token, password: ""
# .request
#   title: "Create a Shred T-shirt Design"
#   body: "We need a cool logo so we can go into the
#     T-shirt business like Docker."
#   labels: [ "ng" ]

issues.expand
  owner: "pandastrike"
  repo: "shred-ng"
.list()
.on "ready", (issues) ->
  for issue in issues
    console.log issue.number, issue.title

issues.expand
  owner: "pandastrike"
  repo: "shred-ng"
.query
  milestone: 1
  status: "open"
.list()
.on "ready", (issues) ->
  for issue in issues
    console.log issue.number, issue.title
