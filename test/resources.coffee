assert = require "assert"

{isFunction, isArray} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred"


module.exports = (context) ->

  context.test "Create a resource from a URL", (context) ->

    github = resource "https://api.github.com/"
    assert isFunction github

    context.test "Create a subordinate resource with a path", ->
      repo = github "repos/pandastrike/shred"
      assert isFunction repo

    context.test "Create a subordinate resource with a template", ->
      repo = (github "repos/{owner}/{repo}/")
      assert isFunction repo owner: "pandastrike", repo: "shred"

    context.test "Create a subordinate resource with an initializer", ->
      github = resource "https://api.github.com/",
        repo: (resource) ->
          resource "repos/{owner}/{repo}/"

      assert isFunction github.repo owner: "pandastrike", repo: "shred"

    context.test "Create a subordinate resource with a request description", ->

      repo =
        resource "https://api.github.com/repos/pandastrike/shred/issues",
          list:
            method: "get"
            headers:
              accept: "application/vnd.github.v3.raw+json"
            expect: 200

      {data} = yield repo.list()
      assert isArray yield data

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

      assert isArray yield data

      context.test "Using a full URL for a nested resource", ->

        {data} = yield github
          .repo
          .issues("https://api.github.com/repos/pandastrike/shred/issues")
          .list()

        assert isArray yield data
