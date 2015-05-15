amen = require "amen"
{call} = require "fairmont"

call ->
  yield amen.describe "Resources", require "./resources"
  yield amen.describe "Requests", require "./requests"
