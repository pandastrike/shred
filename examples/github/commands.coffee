{resolve} = require "path"
{read} = require "fairmont"

github = require "./github"

token = read(resolve(__dirname, ".token")).trim()

github.on "error", (error) -> console.log error

module.exports =

  list: ({owner, repo}) ->
    github
    .repo {owner, repo}
    .issues
    .list()
    .on "ready", (issues) ->
      console.log number, title for {number, title} in issues

  create: ({owner, repo, title, body}) ->
    github
    .repo {owner, repo}
    .issues
    .create
    .authorize basic: {username: token, password: ""}
    .invoke {title, body}
    .on "ready", ->
      console.log "issues created"
