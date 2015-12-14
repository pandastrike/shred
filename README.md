# Overview

Shred is an HTTP client that wraps HTTP interfaces so you can easily create CoffeeScript or JavaScript clients.

Define your client:

```coffeescript
github = resource "https://api.github.com/",
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
```

And then use it:

```coffeescript
try
  {data} = yield github
    .repo {owner, repo}
    .issues
    .list()
  console.log number, title for {number, title} in (yield data)
catch error
  console.error error
```

## Installation

```
npm install shred
```

## Status

Shred 1.0.x is a complete reboot of the project. The goal is the same, but the interface has changed drastically. Shred 1.0.x is _not_ backwards compatible with earlier versions.

Shred is presently `alpha` quality code, as designated by the version suffix.

## Description

HTTP is a rich protocol, but the low-level details of setting headers and checking response codes muck up our code. So we either ignore these nuances or write wrapper functions to hide the details.

Shred makes it easy to declaratively create API wrapper functions. Shred also features support for URL templates, response compression, authorization, and streaming responses. And more features are coming soon!

## API

* `resource`: Define a resource. Takes a URL, path, or URL template, and an interface declaration.

### Interface Definitions

Interface definitions are an object whose properties define subresources or request methods on the resource being defined.

If a property contains an object, it will be defined as a request method described the object.

If it contains a function, the property will define a subresource for which the function is the initializer.

### Request Method Descriptions

Request method descriptions can include three properties:

* `method`: The HTTP method used to make the request, ex: `GET`, `PUT`.

* `headers`: An object describing the HTTP headers to send with the request, ex: `content-type`, `accept`.

* `expect`: The expected HTTP status code, ex: `200`. Other status codes will be treated as errors.

### Subresource Initializer Functions

The signature for resource initializers is:

```coffeescript
(resource) ->
```

The `resource` function passed into the initializer functions works just as the `resource` exported by Shred. You can use it to define the subresource.

Typically, you'll want to use paths or template URLs to define subresources, which will be concatenated with the parent resources' URLs.

Subresources defined using URL templates will be functions, allowing you to pass in an object whose key-value pairs will instantiate the template.

### Shred Responses

When you invoke a Shred request functions, you get back a response context. This contains both the HTTP response object and a data object. The data object is a promise that resolves when the response body is finished streaming. If the `content-type` appears to be JSON-based, Shred will parse the response body as JSON and return an object, otherwise, it will return a string.

### Explicit Invocation

You can explicit invoke Shred request functions using the `invoke` command. This is particularly useful when using helper functions defined on the request function, such as `authorize`.

### Authorization With Shred

You can use the `authorization` method defined on request functions to pass authorization information into the request. The `authorization` function takes a object describing the authorization scheme. Currently, `basic` and `bearer` are supported.

#### Example

```coffeescript
try
  yield github
    .repo {owner, repo}
    .issues
    .create
    .authorize basic: {username: token, password: ""}
    .invoke {title, body}
```
