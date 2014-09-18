assert = require "assert"

{type} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred"
amen = require "amen"

{promise, async, lift, call} = do ->
  {promise} = require "when"
  {lift, call} = require "when/generator"
  {promise, async: lift, call}



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
          with a request description", async (context) ->

          shredRepo =
            resource "https://api.github.com/repos/pandastrike/shred/issues",
              list:
                method: "get"
                headers:
                  accept: "application/vnd.github.v3.raw+json"
                expect: 200

          (yield shredRepo.list())
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

          response = yield github
          .repo owner: "pandastrike", repo: "shred"
          .issues
          .list()

          response
          .on "ready", (issues) ->
            context.pass -> assert.equal type(issues), "array"

          context.test "Using a full URL for a nested resource", (context) ->
            response = yield github
            .repo
            .issues("https://api.github.com/repos/pandastrike/shred/issues")
            .list()

            response
            .on "ready", (issues) ->
              context.pass -> assert.equal type(issues), "array"
          context.test "Make an authorized request", ->
