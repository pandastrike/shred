{resolve} = require "path"
{read} = require "fairmont"
async = (require "when/generator").lift
github = require "./github"

token = read(resolve(__dirname, ".token")).trim()

module.exports =

  list: async ({owner, repo}) ->
    try
      {data} = yield github
        .repo {owner, repo}
        .issues
        .list()
      console.log number, title for {number, title} in (yield data)
    catch error
      console.error error

  create: async ({owner, repo, title, body}) ->
    try
      yield github
        .repo {owner, repo}
        .issues
        .create
        .authorize basic: {username: token, password: ""}
        .invoke {title, body}
      console.log "issues created"
    catch error
      console.error error
