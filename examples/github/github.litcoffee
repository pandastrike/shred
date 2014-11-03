# GitHub API Example

This example defines a simple CLI for GitHub. Shred is used to wrap the API in an easy to access client library.

First, we require Shred. Since this is an example, we use the relative path to the source. In real life, you'd just do `require "shred"`.

    {resource} = require "../../src/shred"

The only thing Shred exports is the `resource` function, which allows you to define new resources.

Let's define one using the URL for the GitHub API.

    module.exports = resource "https://api.github.com/",

The second argument to the `resource` function is an object describing the resource. The properties will be the properties or methods of the resulting resource.

In this case, we're mainly interested in access repositories, so we'll define a property with the name `repo` and pass in an initializer function for it.

      repo: (resource) ->

The `repo` property will give us access to a subresource of our main GitHub API resource. We'll use a URL template to define it.

        resource "repos/{owner}/{repo}/",

That will define our `repo` property as a function taking an object with `owner` and `repo` properties. When that function is called it will return the repo subresource. From there, we want to be able to get the `issues` resource, so we'll pass in an interface description accordingly.

          issues: (resource) ->
            resource "issues",

At this point, we want to define some request methods for our `issues` resource. So instead of intializer functions to define subresources, we'll pass in an object to describe the request method.

              create:
                method: "post"
                headers:
                  accept: "application/vnd.github.v3.raw+json"
                expect: 201

This tells Shred that we want to chain a `create` method off our `issues` resource. When called, that method will make a `POST` request with the given headers. We expect a `201 Created` back. Anything else, we'll treat as an error.

              list:
                method: "get"
                headers:
                  accept: "application/vnd.github.v3.raw+json"
                expect: 200

Similarly, we want to define a `list` method that will make a `GET` request.
