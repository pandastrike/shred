#
# This is a bit of an experiment. I love the simplicity of the Testify
# interface. However, I wanted to see if I could simplify the implementation
# to make it a bit easier to hack on. It seemed to me that a stack-based
# approach using closures would be easier to reason about than the FSA
# model that Testify uses. At < 100 LoC, I think so far the results are
# encouraging, although Testify has a lot more features.
#

assert = require "assert"
colors = require "colors"
{inspect} = require "util"

{push, pop, summarize} = do ->

  current = null
  root = null

  make = (description, parent=null) ->
    context = {description,parent}
    context.kids = []
    context

  push = (description) ->
    context = make description, current
    current.kids.push(context) if current?
    root ?= context
    current = context

  pop = -> current = current.parent

  report = (context) ->
    if context.result?
      if context.error?
        console.log "#{context.description} #{inspect(context.error)}".red
      else
        color = (if context.result then "green" else "red")
        console.log context.description[color]
    else
      console.log context.description.green.bold

  summarize = (context=root) ->
    report context
    summarize(kid) for kid in context.kids

  {push, pop, summarize}

module.exports = do ->

  {start, finish} = do (pending=0) ->
    start: -> pending++
    finish: ->
      if --pending is 0
        process.exit(0)

  test: (description, fn) ->

    context = push(description)
    context.result = false
    start()

    pass = (assert) ->
      try
        assert?()
        context.result = true
      catch
        context.result = false

      finish()

    fail = (error) ->
      context.error = error
      context.result = false
      finish()

    try
      if fn.length > 0
        value = fn({pass,fail})
        if value?.on?
          value.on "error", fail
      else
        fn(); pass()
    catch error
      fail()

    pop()

  describe: (title, fn) ->
    push(title); fn(); pop()


process.on "exit", -> summarize()
