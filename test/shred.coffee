assert = require "assert"

{type} = require "fairmont"
{resolve} = require "path"
{resource} = require "../src/shred"
{describe, test} = require "./test"

describe "Resources", ->

  # github = resource "https://api.github.com/",
  #
  #   issues: ({path}) ->
  #
  #     path "repos/{owner}/{repo}/issues",
  #
  #       for: ({expand}) ->
  #
  #         expand
  #
  #           create:
  #             method: "post"
  #             headers:
  #               accept: "application/vnd.github.v3.raw+json"
  #             expect: 201
  #
  #           list:
  #             method: "get"
  #             headers:
  #               accept: "application/vnd.github.v3.raw+json"
  #             expect: 200

  test "Create a resource from a URL", ->
    github = resource "https://api.github.com/"
    assert.equal github._url, "https://api.github.com/"

  test "Create a resource from another resource", ->
    github = resource "https://api.github.com/",
      issues: ({path}) -> path "repos/{owner}/{repo}/issues",
    assert.equal github.issues._url,
      "https://api.github.com/repos/{owner}/{repo}/issues"

  #
  #
  #   github
  #   .issues
  #   .for(owner: "pandastrike", repo: "shred")
  #   .list()
  #   .on "ready", (issues) ->
  #     console.log issues
  #
  #
  #   assert.equal github.issues?, true
  #
  #
  #     issues = github.path "repos/pandastrike/shred/issues"
  #     assert.equal issues.describe?, true
  #
  #     test "Describe a resource", ->
  #
  #       issues.describe
  #         list:
  #           method: "get"
  #           headers:
  #             accept: "application/vnd.github.v3.raw+json"
  #           expect: 200
  #
  #       assert.equal issues.list?, true
  #
  #       test "Invoke an action", ({pass}) ->
  #
  #         issues.list()
  #         .on "ready", (issues) ->
  #           pass ->
  #             assert.equal type(issues), "array"
  #
  #
  #       test "Create a resource from a query", ({pass}) ->
  #
  #         milestone  = issues.query
  #           milestone: 1
  #           status: "open"
  #
  #         milestone.list()
  #         .on "ready", (issues) ->
  #           pass ->
  #             assert.equal type(issues), "array"
  #
  #       test "Create a resource from a template", ({pass}) ->
  #
  #         github.path "repos/{owner}/{repo}/issues"
  #         .describe
  #           list:
  #             method: "get"
  #             headers:
  #               accept: "application/vnd.github.v3.raw+json"
  #             expect: 200
  #         .expand
  #           owner: "pandastrike"
  #           repo: "shred"
  #         .list()
  #         .on "ready", (issues) ->
  #           pass ->
  #             assert.equal type(issues), "array"
  #
  # test "Automatically decode Gzipped responses", ({pass}) ->
  #
  #   site = resource "http://pandastrike.com/"
  #   .describe
  #     get:
  #       method: "get"
  #       headers:
  #         accept: "text/html"
  #         "accept-encoding": "gzip"
  #       expect: 200
  #
  #   site.get()
  #   .on "ready", (html) ->
  #     pass ->
  #       assert.equal type(html), "string"
  #
  # test "Handle multiple expected values", ({pass}) ->
  #
  #   site = resource "http://google.com"
  #   .describe
  #     get:
  #       method: "get"
  #       headers:
  #         accept: "text/html"
  #       expect: [ 200 ]
  #   site.get()
  #   .on "ready", (html) ->
  #     pass -> assert.equal type(html), "string"
  #
  # test "Allow for streaming responses", ({pass}) ->
  #
  #   site = resource "http://google.com"
  #   .describe
  #     get:
  #       method: "get"
  #       headers:
  #         accept: "text/html"
  #       expect: [ 200 ]
  #   through = require "through"
  #   site.get().pipe(through (->), -> pass())
  #
  # test "Use basic authoriziation",  ->
