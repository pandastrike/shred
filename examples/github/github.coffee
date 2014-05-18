{resolve} = require "path"
{resource} = require "../../src/shred"
{base64, read} = require "fairmont"

token = read(resolve(__dirname, ".token")).trim()

github = resource "https://api.github.com/",
  repo: (resource) ->
    resource "repos/{owner}/{repo}/",
      issues: (resource) ->
        resource "issues",
          create:
            method: "post"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 201
          list:
            method: "get"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 200

github
.on "error", (error) ->
  console.log error
.repo owner: "pandastrike", repo: "shred"
.issues
.list()
.on "ready", (issues) ->
  for {number, title} in issues
    console.log number, title

# create a new ticket...
# github
# .issues owner: "pandastrike", repo: "shred"
# .create
# .authorize basic: {username: token, password: ""}
# .invoke
#   title: "Make Body Processing Extensible"
#   body: "We currently check for JSON bodies and parse them. We want
#     to make it easier to support parsing and validating custom
#     media types"
#   milestone: 2
#   labels: [ "ng" ]
#
# issues = github.issues(owner: "pandastrike", repo: "shred")
#
# issues milestone: 1, status: "open"
# .list()
# .on "ready", (issues) ->
#   for {number, title} in issues
#     console.log number, title
