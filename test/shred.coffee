assert = require "assert"

{type} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred"
amen = require "amen"

amen.describe "Resources", (context) ->

  context.test "Create a resource from a URL", (context) ->

    github = resource "https://api.github.com/"
    assert.equal type(github), "function"

    context.test "Create a subordinate resource with a path", ->
      repo = github "repos/pandastrike/shred"
      assert.equal type(repo), "function"

    context.test "Create a subordinate resource with a template", ->
      repo = (github "repos/{owner}/{repo}/")
      assert.equal type(repo owner: "pandastrike", repo: "shred"), "function"

    context.test "Create a subordinate resource with an initializer", ->
      github = resource "https://api.github.com/",
        repo: (resource) ->
          resource "repos/{owner}/{repo}/"

      assert.equal type(github.repo owner: "pandastrike", repo: "shred"),
        "function"

    context.test "Create a subordinate resource with a request description", ->

      repo =
        resource "https://api.github.com/repos/pandastrike/shred/issues",
          list:
            method: "get"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 200

      {data} = yield repo.list()
      assert.equal type(yield data), "array"

    context.test "Create a nested subordinate resource
      using an initializer with a request description", ->

      github = resource "https://api.github.com/",
        repo: (resource) ->
          resource "repos/{owner}/{repo}/",
            issues: (resource) ->
              resource "issues",
                list:
                  method: "get"
                  headers:
                    accept: "application/vnd.github.v3.raw+json"
                  expect: 200

      {data} = yield github
        .repo owner: "pandastrike", repo: "shred"
        .issues
        .list()

      assert.equal type(yield data), "array"

      context.test "Using a full URL for a nested resource", ->

        {data} = yield github
          .repo
          .issues("https://api.github.com/repos/pandastrike/shred/issues")
          .list()

        assert.equal type(yield data), "array"

      context.test "Make an authorized request"
