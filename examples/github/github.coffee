{resolve} = require "path"
{resource} = require "../../src/shred"
{base64, read} = require "fairmont"

token = read(resolve(__dirname, ".token")).trim()

github = resource "https://api.github.com/",
  issues: ({path}) ->
    path "repos/{owner}/{repo}/issues",
      for: ({expand}) ->
        expand
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
.issues
.for(owner: "pandastrike", repo: "shred")
.list()
.on "ready", (issues) ->
  for {number, title} in issues
    console.log number, title




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

# issues.expand
#   owner: "pandastrike"
#   repo: "shred"
# .list()
# .on "ready", (issues) ->
#   for issue in issues
#     console.log issue.number, issue.title
#
# issues.expand
#   owner: "pandastrike"
#   repo: "shred"
# .query
#   milestone: 1
#   status: "open"
# .list()
# .on "ready", (issues) ->
#   for issue in issues
#     console.log issue.number, issue.title
