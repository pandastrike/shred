Testify = require("testify")
window.Buffer = require("buffer-browserify").Buffer
assert = require("assert")

saneTimeout = (ms, fn) -> setTimeout(fn, ms)

Testify.reporter = new Testify.DOMReporter("testify", 2000)
require "../shred_test"
#require "../headers_test"
#require "../headers_test"

