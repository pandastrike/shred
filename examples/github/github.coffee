{resolve} = require "path"
{resource} = require "../../src/shred"
{base64, read} = require "fairmont"
github = resource "https://api.github.com/"

token = read(resolve(__dirname, ".token")).trim()

github.events
.on "error", (error) -> console.log error

issues = github.resource "repos/pandastrike/shred/issues"
.describe
  list:
    method: "get"
    headers:
      accept: "application/vnd.github.v3.raw+json"
    expect: 200
  create:
    method: "post"
    headers:
      authorization: "Basic " +
        base64("#{token}:")
      accept: "application/vnd.github.v3.raw+json"
    expect: 201

# create a new ticket...
# issues.create
#   title: "Create a Shred logo"
#   body: "We need a cool logo so we can go into the
#     T-shirt business like Docker."
#   labels: [ "ng" ]

issues.list()
.on "ready", (issues) ->
  for issue in issues
    console.log issue.number, issue.title

issues.query
  milestone: 1
  status: "open"
.list()
.on "ready", (issues) ->
  for issue in issues
    console.log issue.number, issue.title
