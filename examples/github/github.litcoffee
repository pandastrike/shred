{resolve} = require "path"
{resource} = require "../../src/shred"
{base64} = require "fairmont"

module.exports = resource "https://api.github.com/",
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
