assert = require "assert"

{type} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred"
{describe, test} = require "./test"

describe "Resources", ->

  test "Create a resource from a URL", ->
    github = resource "https://api.github.com/"
    assert.equal type(github), "function"

    test "Create a subordinate resource with a path", ->
      repo = github "repos/pandastrike/shred"
      assert.equal type(repo), "function"

    test "Create a subordinate resource with a template", ->
      repo = github "repos/{owner}/{repo}/"
      shredRepo = repo owner: "pandastrike", repo: "shred"
      assert.equal type(shredRepo), "function"

      test "Create a subordinate resource with an initializer", ->
        github = resource "https://api.github.com/",
          repo: (resource) ->
            resource "repos/{owner}/{repo}/"

        shredRepo = github.repo owner: "pandastrike", repo: "shred"
        assert.equal type(shredRepo), "function"

        test "Create a subordinate resource
          with a request description", ({pass}) ->

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
            pass -> assert.equal type(issues), "array"

        test "Create a nested subordinate resource
          using an initializer with a request description", ({pass})->

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
            pass -> assert.equal type(issues), "array"

          test "Make an authorized request"
