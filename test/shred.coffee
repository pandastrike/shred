assert = require "assert"

{type} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred"
amen = require "amen"

amen.describe "Resources", (context) ->

  context.test "Create a resource from a URL", ->
    github = resource "https://api.github.com/"
    assert.equal type(github), "function"

    context.test "Create a subordinate resource with a path", ->
      repo = github "repos/pandastrike/shred"
      assert.equal type(repo), "function"

    context.test "Create a subordinate resource with a template", ->
      repo = github "repos/{owner}/{repo}/"
      shredRepo = repo owner: "pandastrike", repo: "shred"
      assert.equal type(shredRepo), "function"

      context.test "Create a subordinate resource with an initializer", ->
        github = resource "https://api.github.com/",
          repo: (resource) ->
            resource "repos/{owner}/{repo}/"

        shredRepo = github.repo owner: "pandastrike", repo: "shred"
        assert.equal type(shredRepo), "function"

        context.test "Create a subordinate resource
          with a request description", (context) ->

          shredRepo =
            resource "https://api.github.com/repos/pandastrike/shred/issues",
              list:
                method: "get"
                headers:
                  accept: "application/vnd.github.v3.raw+json"
                expect: 200

          shredRepo
          .list()
          .on "ready", (issues) ->
            context.pass -> assert.equal type(issues), "array"

        context.test "Create a nested subordinate resource
          using an initializer with a request description", (context)->

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

          github
          .repo owner: "pandastrike", repo: "shred"
          .issues
          .list()
          .on "ready", (issues) ->
            context.pass -> assert.equal type(issues), "array"

          context.test "Make an authorized request", ->
